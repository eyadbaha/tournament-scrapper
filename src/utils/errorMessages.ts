const errorHandleMap = new Map([
  [400, "Bracket fetching is only supported for Single Elimination Tournaments"],
  [404, "Invalid Tournament ID"],
  [500, "Internal Server Error"],
]);
errorHandleMap.default = "Internal Server Error";

export default errorHandleMap;
