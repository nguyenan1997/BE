// Chuyển đổi chuỗi số dạng '1,8 N', '2,3 Tr', '1,2 T' thành số nguyên
function parseViewCount(str) {
  if (!str) return null;
  str = String(str).trim();
  str = str.replace(',', '.');
  if (str.endsWith('N')) {
    return Math.round(parseFloat(str) * 1000);
  }
  if (str.endsWith('Tr')) {
    return Math.round(parseFloat(str) * 1000000);
  }
  if (str.endsWith('T')) {
    return Math.round(parseFloat(str) * 1000000000);
  }
  // Nếu chỉ là số
  return parseInt(str, 10);
}

module.exports = {
  parseViewCount,
}; 