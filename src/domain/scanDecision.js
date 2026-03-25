export function canApproveScannedRequest({ requestStatus, validationStatus }) {
  if (validationStatus !== 'allowed') return false;
  return requestStatus === 'pending' || requestStatus === 'approved';
}

