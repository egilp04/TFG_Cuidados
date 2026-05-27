export interface CancelModalData {
  mode:
    | 'unsubscribe'
    | 'cancelContract'
    | 'delete'
    | 'deleteService'
    | 'deleteGlobalAdmin'
    | 'cancelUser';
}
