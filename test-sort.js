const offsetString = "UTC-5";
const match = /UTC([+-])(\d+)(?::(\d+))?/.exec(offsetString);
let numericOffset = 0;
if (match) {
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);
  numericOffset = sign * (hours * 60 + minutes);
}
console.log(numericOffset);
