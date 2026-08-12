package com.lottierefreshheader

import android.animation.ValueAnimator
import android.content.Context
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * SwipeRefreshLayout 经典拦截方案的下拉刷新容器。
 * RN 的 ReactScrollView 是 android.widget.ScrollView，不支持 NestedScrollingChild，
 * 因此与 androidx SwipeRefreshLayout / RN RefreshControl 一致，采用触摸拦截实现：
 *  - 子视图不能向上滚（到顶）时下拉 → 拦截并拉动头部
 *  - 子视图可滚动时不拦截，列表正常滚动
 *  - 头部已拉出时上拖 → 拦截并收回头部
 * 子视图约定：第一个被添加的 child = React 头部（lottie），其余 = ScrollView 内容。
 */
class LottieRefreshHeaderView(context: Context) : FrameLayout(context) {

    var triggerHeightDp = 100f
    var headerHeightDp = 80f

    private val density = resources.displayMetrics.density
    private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop

    private val triggerPx get() = triggerHeightDp * density
    private val headerPx get() = headerHeightDp * density
    private val maxDragPx get() = triggerPx * 1.5f

    private var pullDistance = 0f
    private var isDragging = false
    private var isRefreshing = false
    private var downY = 0f
    private var lastY = 0f
    private var lastState = -1
    private var animator: ValueAnimator? = null

    /** 第一个被添加的子视图 = React 头部（lottie），用字段追踪而非索引（bringToFront 会改变索引） */
    private var headerView: View? = null

    override fun onViewAdded(child: View) {
        super.onViewAdded(child)
        Log.d(TAG, "onViewAdded: ${child.javaClass.simpleName}, count=$childCount")
        if (headerView == null) {
            headerView = child
        } else {
            headerView?.bringToFront()
        }
    }

    override fun onViewRemoved(child: View) {
        if (child === headerView) {
            headerView = null
        }
        super.onViewRemoved(child)
    }

    // ------------------------------------------------------ touch intercept

    override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
        if (!isEnabled) return false
        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                downY = ev.y
                lastY = ev.y
                isDragging = false
            }
            MotionEvent.ACTION_MOVE -> {
                val dy = ev.y - downY
                val canUp = canChildScrollUp()
                val draggingDown = dy > touchSlop && !canUp
                val draggingUpWithHeaderOpen =
                    dy < -touchSlop && pullDistance > 0f && !isRefreshing
                if (draggingDown || draggingUpWithHeaderOpen) {
                    Log.d(TAG, "intercept MOVE: dy=$dy, canChildScrollUp=$canUp, pull=$pullDistance")
                    isDragging = true
                    lastY = ev.y
                    return true
                }
            }
        }
        return super.onInterceptTouchEvent(ev)
    }

    override fun onTouchEvent(ev: MotionEvent): Boolean {
        when (ev.actionMasked) {
            MotionEvent.ACTION_MOVE -> {
                if (!isDragging) return super.onTouchEvent(ev)
                val dy = ev.y - lastY
                lastY = ev.y
                setPullDistance(pullDistance + dy * DRAG_RESISTANCE)
                return true
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                if (isDragging) {
                    isDragging = false
                    if (pullDistance >= triggerPx && !isRefreshing) {
                        startRefreshing()
                    } else if (!isRefreshing) {
                        animatePullTo(0f)
                    }
                    return true
                }
            }
        }
        return super.onTouchEvent(ev)
    }

    private fun canChildScrollUp(): Boolean {
        for (i in 0 until childCount) {
            val child = getChildAt(i)
            if (child !== headerView && canViewScrollUp(child)) return true
        }
        return false
    }

    /** 递归查找真正可向上滚动的后代（Fabric 下 ScrollView 可能被 ReactViewGroup 包装） */
    private fun canViewScrollUp(view: View): Boolean {
        if (view.canScrollVertically(-1)) return true
        if (view is android.view.ViewGroup) {
            for (j in 0 until view.childCount) {
                if (canViewScrollUp(view.getChildAt(j))) return true
            }
        }
        return false
    }

    // ------------------------------------------------------ pull

    private fun setPullDistance(value: Float) {
        val clamped = max(0f, min(value, maxDragPx))
        if (clamped == pullDistance) return
        pullDistance = clamped
        applyPull()
        emitOffset(pullDistance / density)
        if (pullDistance >= triggerPx) {
            emitStateIfChanged(STATE_PULLING)
        } else {
            emitStateIfChanged(STATE_IDLE)
        }
    }

    private fun applyPull() {
        // header 的 Yoga 位置在 top:0（高度 headerPx），隐藏/滑出全部由 translationY 驱动：
        // 静止时 translationY = -headerPx（藏在容器上方），下拉时随 pullDistance 滑入
        headerView?.translationY = pullDistance - headerPx
        for (i in 0 until childCount) {
            val child = getChildAt(i)
            if (child !== headerView) {
                child.translationY = pullDistance
            }
        }
    }

    private fun animatePullTo(target: Float, onEnd: (() -> Unit)? = null) {
        animator?.cancel()
        val start = pullDistance
        animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 200
            interpolator = DecelerateInterpolator()
            addUpdateListener { anim ->
                val fraction = anim.animatedValue as Float
                setPullDistance(start + (target - start) * fraction)
            }
            if (onEnd != null) {
                addListener(object : android.animation.AnimatorListenerAdapter() {
                    override fun onAnimationEnd(animation: android.animation.Animator) {
                        onEnd()
                    }
                })
            }
            start()
        }
    }

    // ------------------------------------------------------ refresh

    private fun startRefreshing() {
        if (isRefreshing) return
        isRefreshing = true
        emitStateIfChanged(STATE_REFRESHING)
        animatePullTo(headerPx)
    }

    /** JS 侧 refreshing 置 false 时调用 */
    fun endRefreshing() {
        if (!isRefreshing) return
        isRefreshing = false
        animatePullTo(0f) {
            emitStateIfChanged(STATE_IDLE)
        }
    }

    private fun emitStateIfChanged(state: Int) {
        if (state == lastState) return
        lastState = state
        dispatchEventToJs(ChangeStateEvent(UIManagerHelper.getSurfaceId(this), id, state))
    }

    private fun emitOffset(offsetDp: Float) {
        dispatchEventToJs(ChangeOffsetEvent(UIManagerHelper.getSurfaceId(this), id, offsetDp))
    }

    private fun dispatchEventToJs(event: Event<*>) {
        val reactContext = context as? ReactContext ?: return
        UIManagerHelper
            .getEventDispatcherForReactTag(reactContext, id)
            ?.dispatchEvent(event)
    }

    override fun onDetachedFromWindow() {
        animator?.cancel()
        animator = null
        isRefreshing = false
        lastState = -1
        super.onDetachedFromWindow()
    }

    companion object {
        const val TAG = "LottieRefreshHeader"
        const val EVENT_CHANGE_OFFSET = "topChangeOffset"
        const val EVENT_CHANGE_STATE = "topChangeState"

        const val STATE_IDLE = 0
        const val STATE_PULLING = 1
        const val STATE_REFRESHING = 2

        const val DRAG_RESISTANCE = 0.5f
    }
}

private class ChangeOffsetEvent(
    surfaceId: Int,
    viewTag: Int,
    private val offsetDp: Float,
) : Event<ChangeOffsetEvent>(surfaceId, viewTag) {
    override fun getEventName() = LottieRefreshHeaderView.EVENT_CHANGE_OFFSET
    override fun getEventData() = Arguments.createMap().apply {
        putDouble("offset", offsetDp.toDouble())
    }
}

private class ChangeStateEvent(
    surfaceId: Int,
    viewTag: Int,
    private val state: Int,
) : Event<ChangeStateEvent>(surfaceId, viewTag) {
    override fun getEventName() = LottieRefreshHeaderView.EVENT_CHANGE_STATE
    override fun getEventData() = Arguments.createMap().apply {
        putInt("state", state)
    }
}
