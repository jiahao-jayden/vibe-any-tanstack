import Decimal from "decimal.js"

export class AmountCalculator {
  toSmallestUnit(amount: Decimal.Value, decimals: number) {
    return new Decimal(amount)
      .mul(new Decimal(10).pow(decimals))
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toString()
  }

  fromSmallestUnit(smallestUnit: Decimal.Value, decimals: number) {
    return new Decimal(smallestUnit).div(new Decimal(10).pow(decimals)).toFixed(decimals)
  }

  normalizeAmount(amount: Decimal.Value, decimals: number) {
    return new Decimal(amount).toFixed(decimals).replace(/\.?0+$/, "")
  }
}

export const amountCalculator = new AmountCalculator()
