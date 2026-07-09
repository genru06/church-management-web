export const BILL_DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1];

export function emptyBillForm() {
  const form = {
    recordDate: new Date().toISOString().slice(0, 10),
    countedBy: "",
    checkedBy: "",
    remarks: ""
  };
  for (const denom of BILL_DENOMINATIONS) {
    form[`bill${denom}`] = 0;
  }
  return form;
}

export function computeBillTotal(form) {
  return BILL_DENOMINATIONS.reduce((sum, denom) => sum + (Number(form[`bill${denom}`]) || 0) * denom, 0);
}
