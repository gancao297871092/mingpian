package com.lottierefreshheader

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.LottieRefreshHeaderManagerDelegate
import com.facebook.react.viewmanagers.LottieRefreshHeaderManagerInterface

@ReactModule(name = LottieRefreshHeaderManager.REACT_CLASS)
class LottieRefreshHeaderManager :
    ViewGroupManager<LottieRefreshHeaderView>(),
    LottieRefreshHeaderManagerInterface<LottieRefreshHeaderView> {

    private val delegate: ViewManagerDelegate<LottieRefreshHeaderView> =
        LottieRefreshHeaderManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<LottieRefreshHeaderView> = delegate

    override fun getName() = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): LottieRefreshHeaderView {
        return LottieRefreshHeaderView(reactContext)
    }

    override fun setRefreshing(view: LottieRefreshHeaderView, value: Boolean) {
        if (!value) {
            view.endRefreshing()
        }
    }

    override fun setTriggerHeight(view: LottieRefreshHeaderView, value: Float) {
        if (value > 0) view.triggerHeightDp = value
    }

    override fun setHeaderHeight(view: LottieRefreshHeaderView, value: Float) {
        if (value > 0) view.headerHeightDp = value
    }

    companion object {
        const val REACT_CLASS = "LottieRefreshHeader"
    }
}
