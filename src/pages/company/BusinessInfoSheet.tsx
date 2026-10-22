import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import AppBottomSheet from '@/components/AppBottomSheet';
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';
import type { CompanyDetailModel } from './UnjoinedCompanyInfo';

const PRIMARY = '#2962D4';
const GRAY = '#6C6C6C';
const LIGHT_BLUE = '#F2F6FF';

export interface BusinessInfoSheetProps {
  detail: CompanyDetailModel;
  onClose?: () => void;
}

function Field({ label, value, longText }: { label: string; value: string; longText?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, longText && styles.valueLong]}>{value || '-'}</Text>
    </View>
  );
}

/** 工商信息详情（figma 1970:6569） */
const BusinessInfoSheet = forwardRef<BottomSheetModal, BusinessInfoSheetProps>(function Sheet(
  { detail, onClose },
  ref,
) {
  return (
    <AppBottomSheet
      ref={ref}
      backgroundColor="#FFFFFF"
      scrollable
      heightRatio={0.85}
      onClose={onClose}
    >
      <Text style={styles.title}>工商信息</Text>

      <Field label="企业名称" value={detail.companyName} />
      <Field label="统一社会信用代码" value={detail.creditNumber} />

      <View style={styles.row}>
        <View style={styles.colLeft}>
          <Field label="企业法人" value={detail.juridicalPerson} />
        </View>
        <View style={styles.colRight}>
          <Field label="注册资本" value={detail.registeredCapital} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.colLeft}>
          <Field label="企业类型" value={detail.companyType} />
        </View>
        <View style={styles.colRight}>
          <Field label="成立日期" value={detail.establishTime} />
        </View>
      </View>

      <Field label="登记地址" value={detail.regitAddress} />
      <Field label="登记机关" value={detail.issuingAuthority} />

      {detail.honors.length > 0 && (
        <View style={styles.honorBlock}>
          <Text style={styles.label}>企业荣誉</Text>
          <View style={styles.honorList}>
            {detail.honors.map((h, i) => (
              <View key={`${h}-${i}`} style={styles.honorItem}>
                <Text style={styles.honorText}>{h}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!!detail.companyProfile && <Field label="企业简介" value={detail.companyProfile} longText />}
      {!!detail.businessScope && <Field label="经营范围" value={detail.businessScope} longText />}
    </AppBottomSheet>
  );
});

export default BusinessInfoSheet;

const styles = StyleSheet.create({
  title: {
    marginTop: scaleSizeH(20),
    fontSize: setSpText(17),
    fontWeight: '500',
    lineHeight: setSpText(23),
    color: '#000000',
  },
  field: {
    gap: scaleSizeH(3),
    marginTop: scaleSizeH(20),
  },
  label: {
    fontSize: setSpText(12),
    lineHeight: setSpText(20),
    color: GRAY,
  },
  value: {
    fontSize: setSpText(14),
    lineHeight: setSpText(20),
    color: '#000000',
  },
  valueLong: {
    lineHeight: setSpText(24),
  },
  row: {
    flexDirection: 'row',
  },
  colLeft: {
    width: scaleSizeW(174),
  },
  colRight: {
    flex: 1,
    paddingLeft: scaleSizeW(16),
  },
  honorBlock: {
    marginTop: scaleSizeH(20),
  },
  honorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSizeW(5),
    marginTop: scaleSizeH(10),
  },
  honorItem: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: scaleSizeW(5),
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(3),
  },
  honorText: {
    fontSize: setSpText(12),
    lineHeight: setSpText(19),
    color: PRIMARY,
  },
});
