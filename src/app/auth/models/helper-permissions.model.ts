export interface HelperPermissionsDto {
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSell: boolean;
  canRecordUse: boolean;
}

export const EMPTY_HELPER_PERMISSIONS: HelperPermissionsDto = {
  canAdd: false,
  canEdit: false,
  canDelete: false,
  canSell: false,
  canRecordUse: false,
};
