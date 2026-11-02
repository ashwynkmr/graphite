import { R, Rational } from '../../matching/rational';
import { an, An, money, num, pct } from '../format';
import type { Template } from '../types';
import { by, NAMES, pickR, rate } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'money',
  kind: 'word',
  ...x,
});

const USD = { prefix: '$' };
const PCT = { suffix: '%' };
const ITEMS = ['jacket', 'laptop', 'sofa', 'concert ticket', 'bicycle', 'pair of shoes', 'lamp', 'backpack'];

/** Answers in dollars and cents only. */
function cents(x: Rational): boolean {
  return (x.decimalPlaces() ?? 9) <= 2;
}

const up = (p: Rational) => R(1).add(rate(p));
const down = (p: Rational) => R(1).sub(rate(p));

export const moneyTopic: Template[] = [
  t({
    id: 'mo-discount',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const item = rng.pick(ITEMS);
      if (d === 3) {
        // Reverse: original price from the sale price.
        const p = pickR(rng, ['15', '35', '12.5', '37.5', '22.5', '17.5']);
        const price = R(rng.int(2, 30) * 40);
        const sale = price.mul(down(p));
        if (!cents(sale)) return null;
        return {
          prompt: `After ${pct(p)} off, a ${item} costs ${money(sale)}. What was the original price?`,
          answer: price,
          unit: USD,
          distractors: [sale.mul(up(p)), sale.add(p), sale.div(rate(p)).div(R(10)), price.add(R(20))],
          explain: `Sale = original × ${num(down(p))}, so original = ${money(sale)} ÷ ${num(down(p))} = ${money(price)}`,
        };
      }
      const price = R(by(d, rng.int(2, 30) * 8, rng.int(2, 25) * 20, 0));
      if (d === 2) {
        const p1 = pickR(rng, ['10', '20', '25', '30', '40']);
        const p2 = pickR(rng, ['10', '20', '25']);
        const after1 = price.mul(down(p1));
        const ans = after1.mul(down(p2));
        if (!cents(ans)) return null;
        return {
          prompt: `A ${money(price)} ${item} is ${pct(p1)} off, with an extra ${pct(p2)} off the sale price at checkout. What is the final price?`,
          answer: ans,
          unit: USD,
          distractors: [price.mul(down(p1.add(p2))), price.sub(ans), after1, ans.add(R(10))],
          explain: `${money(price)} × ${num(down(p1))} = ${money(after1)}; × ${num(down(p2))} = ${money(ans)}`,
        };
      }
      const p = pickR(rng, ['15', '30', '35', '40', '12.5']);
      const off = price.mul(rate(p));
      const ans = price.sub(off);
      if (!cents(ans)) return null;
      return {
        prompt: `A ${money(price)} ${item} is ${pct(p)} off. What is the sale price?`,
        answer: ans,
        unit: USD,
        distractors: [off, price.add(off), price.sub(p), ans.sub(R(10))],
        explain: `${pct(p)} of ${money(price)} is ${money(off)}; ${money(price)} − ${money(off)} = ${money(ans)}`,
      };
    },
  }),

  t({
    id: 'mo-markup',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const item = rng.pick(['lamp', 'chair', 'watch', 'rug', 'kettle', 'mirror']);
      if (d === 1) {
        const cost = R(rng.int(2, 25) * 8);
        const p = pickR(rng, ['15', '35', '40', '60', '12.5']);
        const markup = cost.mul(rate(p));
        const ans = cost.add(markup);
        if (!cents(ans)) return null;
        return {
          prompt: `A store buys a ${item} for ${money(cost)} and marks it up ${pct(p)}. What is the selling price?`,
          answer: ans,
          unit: USD,
          distractors: [markup, cost.sub(markup), cost.add(p), ans.add(R(10))],
          explain: `${pct(p)} of ${money(cost)} is ${money(markup)}; ${money(cost)} + ${money(markup)} = ${money(ans)}`,
        };
      }
      const cost = R(rng.int(2, 25) * 20);
      const u = pickR(rng, ['20', '25', '40', '50', '60']);
      const dn = pickR(rng, ['10', '20', '25']);
      const marked = cost.mul(up(u));
      const sell = marked.mul(down(dn));
      if (!cents(sell)) return null;
      if (d === 3) {
        // Net profit percent after markup and discount
        const ans = up(u).mul(down(dn)).sub(R(1)).mul(R(100));
        if (ans.equals(R(0))) return null;
        return {
          prompt: `A store marks a ${item} up ${pct(u)} over cost, then sells it at ${pct(dn)} off the marked price. What is the profit as a percent of cost? (Use − for a loss.)`,
          answer: ans,
          unit: PCT,
          distractors: [u.sub(dn), up(u).mul(down(dn)).mul(R(100)), u.sub(dn).add(R(5)), ans.neg()],
          explain: `${num(up(u))} × ${num(down(dn))} = ${num(up(u).mul(down(dn)))}, so ${ans.isNegative() ? 'a loss' : 'a profit'} of ${num(ans.isNegative() ? ans.neg() : ans)}% (not ${num(u.sub(dn))}%)`,
        };
      }
      return {
        prompt: `A store buys a ${item} for ${money(cost)}, marks it up ${pct(u)}, then sells it at ${pct(dn)} off the marked price. What is the selling price?`,
        answer: sell,
        unit: USD,
        distractors: [cost.mul(up(u.sub(dn))), marked, sell.sub(cost), sell.add(R(10))],
        explain: `${money(cost)} × ${num(up(u))} = ${money(marked)}; × ${num(down(dn))} = ${money(sell)}`,
      };
    },
  }),

  t({
    id: 'mo-profit-percent',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        // Reverse: cost from selling price.
        const p = pickR(rng, ['12.5', '37.5', '20', '25', '60', '15']);
        const loss = rng.chance(0.4);
        const cost = R(rng.int(2, 25) * 40);
        const sell = cost.mul(loss ? down(p) : up(p));
        if (!cents(sell)) return null;
        return {
          prompt: `An item sold for ${money(sell)} at a ${pct(p)} ${loss ? 'loss' : 'profit'}. What did it cost?`,
          answer: cost,
          unit: USD,
          distractors: [sell.mul(loss ? up(p) : down(p)), loss ? sell.add(p) : sell.sub(p), sell, cost.add(R(40))],
          explain: `Selling price = cost × ${num(loss ? down(p) : up(p))}, so cost = ${money(sell)} ÷ ${num(loss ? down(p) : up(p))} = ${money(cost)}`,
        };
      }
      const p = pickR(rng, by(d, ['15', '30', '40', '12.5', '60'], ['20', '25', '50', '60', '100'], []));
      const cost = R(by(d, rng.int(2, 20) * 40, rng.int(2, 20) * 10, 0));
      const loss = d === 1 && rng.chance(0.3);
      const sell = cost.mul(loss ? down(p) : up(p));
      if (!cents(sell)) return null;
      const diff = loss ? cost.sub(sell) : sell.sub(cost);
      if (d === 2) {
        const ans = diff.div(sell).mul(R(100));
        if ((ans.decimalPlaces() ?? 9) > 1) return null;
        return {
          prompt: `An item bought for ${money(cost)} sells for ${money(sell)}. What is the profit as a percent of the selling price?`,
          answer: ans,
          unit: PCT,
          distractors: [p, diff, ans.add(R(5)), R(100).sub(ans)],
          explain: `Profit ${money(diff)} ÷ selling price ${money(sell)} = ${pct(ans)} (not ÷ cost, which gives ${pct(p)})`,
        };
      }
      return {
        prompt: `An item bought for ${money(cost)} sells for ${money(sell)}. What is the ${loss ? 'loss' : 'profit'} as a percent of the cost?`,
        answer: p,
        unit: PCT,
        distractors: [diff.div(sell).mul(R(100)), diff, p.add(R(5)), p.sub(R(5))],
        explain: `${loss ? 'Loss' : 'Profit'} ${money(diff)} ÷ cost ${money(cost)} = ${pct(p)}`,
      };
    },
  }),

  t({
    id: 'mo-simple-interest',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const P = R(by(d, rng.int(1, 40) * 100, rng.int(2, 40) * 200, rng.int(2, 40) * 500));
      const r = pickR(rng, by(d, ['3', '4', '6', '2.5'], ['3.5', '7.5', '4.5', '6'], ['2.5', '3.5', '4', '5', '6', '7.5']));
      const months = d === 2 ? rng.pick([6, 9, 18, 30]) : 0;
      const years = d === 2 ? R(months, 12) : R(rng.int(2, 5));
      const interest = P.mul(rate(r)).mul(years);
      if (!cents(interest)) return null;
      if (d === 3) {
        return {
          prompt: `At ${pct(r)} simple interest per year, an investment earns ${money(interest)} in ${num(years)} years. How much was invested?`,
          answer: P,
          unit: USD,
          distractors: [interest.div(rate(r)), interest.mul(years).div(rate(r)), interest.div(rate(r)).div(years).mul(R(10)), P.sub(interest)],
          explain: `Interest = P × ${num(rate(r))} × ${num(years)} = P × ${num(rate(r).mul(years))}, so P = ${money(interest)} ÷ ${num(rate(r).mul(years))} = ${money(P)}`,
        };
      }
      const askTotal = d === 1;
      const ans = askTotal ? P.add(interest) : interest;
      const time = d === 2 ? `${months} months` : `${num(years)} years`;
      const compound = P.mul(up(r).pow(Number(years.n / years.d) || 1)).sub(P);
      return {
        prompt: `${money(P)} earns ${pct(r)} simple interest per year. ${askTotal ? `What is the total after ${time}?` : `How much interest is earned in ${time}?`}`,
        answer: ans,
        unit: USD,
        distractors: askTotal
          ? [P.add(P.mul(rate(r))), P.add(compound), interest, ans.add(R(100))]
          : [P.mul(rate(r)), P.mul(rate(r)).mul(R(months)), interest.mul(R(10)), interest.add(R(10))],
        explain: `Interest = amount × rate × years: ${money(P)} × ${num(rate(r))} × ${num(years)} = ${money(interest)}${askTotal ? `; + ${money(P)} = ${money(ans)}` : ''}`,
      };
    },
  }),

  t({
    id: 'mo-compound',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        if (rng.chance(0.5)) {
          // How much more compound earns than simple over 2 years: P × r²
          const P = R(rng.pick([1000, 2000, 2500, 4000, 5000, 8000, 10000]));
          const r = pickR(rng, ['5', '8', '10', '12', '15', '20']);
          const ans = P.mul(rate(r)).mul(rate(r));
          if (!cents(ans)) return null;
          return {
            prompt: `How much more does ${money(P)} earn in 2 years at ${pct(r)} compounded yearly than at ${pct(r)} simple interest?`,
            answer: ans,
            unit: USD,
            distractors: [P.mul(rate(r)), P.mul(rate(r)).mul(R(2)), ans.mul(R(2)), ans.mul(R(10))],
            explain: `The only difference is interest on the first year's interest: ${money(P.mul(rate(r)))} × ${num(rate(r))} = ${money(ans)}`,
          };
        }
        const P = R(rng.pick([1000, 2000, 3000, 5000, 10000]));
        const ans = P.mul(R('1.1').pow(3));
        return {
          prompt: `${money(P)} is invested at 10% a year, compounded yearly. What is it worth after 3 years?`,
          answer: ans,
          unit: USD,
          distractors: [P.mul(R('1.3')), P.mul(R('1.21')), ans.sub(P), ans.add(R(100))],
          explain: `1.1 × 1.1 × 1.1 = 1.331; ${money(P)} × 1.331 = ${money(ans)}`,
        };
      }
      const P = R(by(d, rng.pick([400, 800, 1000, 2000, 4000, 5000]), rng.pick([1000, 2500, 4000, 5000, 10000]), 0));
      const semi = d === 2 && rng.chance(0.4);
      const r = pickR(rng, by(d, ['5', '20'], semi ? ['10', '20', '8'] : ['4', '8', '15', '25'], []));
      const per = semi ? rate(r).div(R(2)) : rate(r);
      const ans = P.mul(R(1).add(per).pow(2));
      if (!cents(ans)) return null;
      return {
        prompt: semi
          ? `${money(P)} is invested at ${pct(r)} a year, compounded every 6 months. What is it worth after 1 year?`
          : `${money(P)} is invested at ${pct(r)} a year, compounded yearly. What is it worth after 2 years?`,
        answer: ans,
        unit: USD,
        distractors: [P.mul(R(1).add(per.mul(R(2)))), ans.sub(P), P.mul(R(1).add(per)), ans.add(R(by(d, 50, 100, 0)))],
        explain: `Each year multiplies by ${num(R(1).add(per))}: ${money(P)} × ${num(R(1).add(per))} × ${num(R(1).add(per))} = ${money(ans)}`,
      };
    },
  }),

  t({
    id: 'mo-tip-tax',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const what = rng.pick(['A dinner bill', 'A haircut', 'A taxi fare', 'A food delivery', 'A café order']);
      if (d > 1) {
        const bill = R(rng.int(2, 8) * 25);
        const tax = pickR(rng, ['8', '6', '5', '10']);
        const tip = pickR(rng, ['15', '20', '18']);
        const factor = R(1).add(rate(tax)).add(rate(tip));
        const total = bill.mul(factor);
        if (!cents(total)) return null;
        const tipOnTaxed = bill.mul(up(tax)).mul(up(tip));
        if (d === 3) {
          return {
            prompt: `A meal's total was ${money(total)}, including ${pct(tax)} tax and ${an(pct(tip))} ${pct(tip)} tip, both on the pre-tax price. What was the pre-tax price?`,
            answer: bill,
            unit: USD,
            distractors: [total.mul(R(1).sub(rate(tax)).sub(rate(tip))), total.div(up(tax).mul(up(tip))), total.sub(tax).sub(tip), total.div(up(tip))],
            explain: `Total = price × (1 + ${num(rate(tax))} + ${num(rate(tip))}) = price × ${num(factor)}, so price = ${money(total)} ÷ ${num(factor)} = ${money(bill)}`,
          };
        }
        return {
          prompt: `${what} is ${money(bill)} before tax. Tax is ${pct(tax)}, and ${an(pct(tip))} ${pct(tip)} tip is added on the pre-tax amount. What is the total?`,
          answer: total,
          unit: USD,
          distractors: [tipOnTaxed, bill.mul(rate(tax.add(tip))), bill.mul(up(tip)), total.add(R(1))],
          explain: `Add the percents to 100%, so multiply by ${num(factor)}: ${money(bill)} × ${num(factor)} = ${money(total)}`,
        };
      }
      const bill = R(rng.int(5, 40) * 4);
      const tip = pickR(rng, ['15', '18', '25']);
      const tipAmt = bill.mul(rate(tip));
      const total = bill.add(tipAmt);
      const split = rng.chance(0.5) ? rng.pick([2, 4, 5]) : 1;
      const ans = total.div(R(split));
      if (!cents(ans)) return null;
      return {
        prompt: `${what} is ${money(bill)}. With ${an(pct(tip))} ${pct(tip)} tip${split > 1 ? `, split equally among ${split} people` : ''}, what is the ${split > 1 ? 'cost per person' : 'total'}?`,
        answer: ans,
        unit: USD,
        distractors: split > 1 ? [total, bill.div(R(split)), tipAmt, ans.add(R(1))] : [tipAmt, bill.add(tip), bill.mul(up(tip.add(R(5)))), ans.add(R(1))],
        explain: `${pct(tip)} of ${money(bill)} is ${money(tipAmt)}; total ${money(total)}${split > 1 ? `; ÷ ${split} = ${money(ans)}` : ''}`,
      };
    },
  }),

  t({
    id: 'mo-commission',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const name = rng.pick(NAMES);
      if (d === 2) {
        const tier = R(rng.pick([5000, 10000, 20000]));
        const sales = tier.add(R(rng.int(1, 30) * 500));
        const r1 = pickR(rng, ['4', '5', '6']);
        const r2 = pickR(rng, ['8', '10', '12']);
        const ans = tier.mul(rate(r1)).add(sales.sub(tier).mul(rate(r2)));
        return {
          prompt: `${name} earns ${pct(r1)} commission on the first ${money(tier)} of sales and ${pct(r2)} on sales above that. How much commission on ${money(sales)} of sales?`,
          answer: ans,
          unit: USD,
          distractors: [sales.mul(rate(r2)), sales.mul(rate(r1)), sales.sub(tier).mul(rate(r2)), ans.add(R(100))],
          explain: `${money(tier)} × ${num(rate(r1))} = ${money(tier.mul(rate(r1)))}; ${money(sales.sub(tier))} × ${num(rate(r2))} = ${money(sales.sub(tier).mul(rate(r2)))}; total ${money(ans)}`,
        };
      }
      const base = R(rng.int(2, 10) * 50);
      const r = pickR(rng, ['4', '6', '8', '3', '5', '7.5']);
      const sales = R(rng.int(10, 90) * 100);
      const comm = sales.mul(rate(r));
      const pay = base.add(comm);
      if (!cents(comm)) return null;
      if (d === 3) {
        return {
          prompt: `${name} earns ${money(base)} a week plus ${pct(r)} commission on sales. One week ${name} earned ${money(pay)}. How much did ${name} sell?`,
          answer: sales,
          unit: USD,
          distractors: [pay.div(rate(r)), pay.add(base).div(rate(r)), comm.div(rate(r)).div(R(10)), sales.add(R(1000))],
          explain: `Commission = ${money(pay)} − ${money(base)} = ${money(comm)}; ÷ ${num(rate(r))} = ${money(sales)}`,
        };
      }
      return {
        prompt: `${name} earns ${money(base)} a week plus ${pct(r)} commission on sales. What is ${name}'s pay in a week with ${money(sales)} of sales?`,
        answer: pay,
        unit: USD,
        distractors: [comm, base.add(sales).mul(rate(r)), base.add(comm.mul(R(10))), pay.add(R(10))],
        explain: `${pct(r)} of ${money(sales)} is ${money(comm)}; + ${money(base)} = ${money(pay)}`,
      };
    },
  }),

  t({
    id: 'mo-unit-price',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [thing, unit, unitPlural] = rng.pick<[string, string, string]>([
        ['box of cereal', 'ounce', 'ounces'],
        ['bottle of juice', 'liter', 'liters'],
        ['bag of rice', 'kilogram', 'kilograms'],
        ['bag of coffee', 'pound', 'pounds'],
        ['pack of pens', 'pen', 'pens'],
      ]);
      if (d === 3) {
        // Which is the better deal, and by how much per unit?
        const s1 = rng.pick([8, 10, 12, 16]);
        const s2 = rng.pick([20, 24, 30, 32, 40]);
        const c1 = rng.int(15, 60);
        const c2 = c1 - rng.int(1, 9);
        if (c2 <= 0) return null;
        const p1 = R(s1 * c1, 100);
        const p2 = R(s2 * c2, 100);
        return {
          prompt: `${An(String(s1))} ${s1}-${unit} ${thing} costs ${money(p1)} and ${an(String(s2))} ${s2}-${unit} one costs ${money(p2)}. How many cents per ${unit} cheaper is the larger one?`,
          answer: R(c1 - c2),
          unit: { suffix: '¢' },
          distractors: [p2.sub(p1).mul(R(100)).div(R(s2 - s1)).round('whole'), R(c1), R(c2), R((c1 - c2) * 10), R(c1 - c2 + 1)],
          explain: `${money(p1)} ÷ ${s1} = ${c1}¢; ${money(p2)} ÷ ${s2} = ${c2}¢; ${c1} − ${c2} = ${c1 - c2}¢`,
        };
      }
      const size = by(d, rng.pick([6, 8, 12, 16, 20]), rng.pick([12, 16, 24, 32]), 0);
      const centsEach = by(d, rng.int(12, 95), rng.int(8, 60), 0);
      const price = R(size * centsEach, 100);
      if (d === 2) {
        const want = rng.int(2, 30);
        if (want === size) return null;
        const ans = R(want * centsEach, 100);
        return {
          prompt: `${An(String(size))} ${size}-${unit} ${thing} costs ${money(price)}. At the same rate, how much do ${want} ${unitPlural} cost?`,
          answer: ans,
          unit: USD,
          distractors: [price.mul(R(size, want)), price.add(R(want - size, 100)), ans.mul(R(10)), ans.add(R(1, 10))],
          explain: `${money(price)} ÷ ${size} = ${centsEach}¢ per ${unit}; × ${want} = ${money(ans)}`,
        };
      }
      return {
        prompt: `${An(String(size))} ${size}-${unit} ${thing} costs ${money(price)}. What is the price per ${unit}, in cents?`,
        answer: R(centsEach),
        unit: { suffix: '¢' },
        distractors: [R(centsEach * 10), R(centsEach, 10).round('whole'), R(size * 100, centsEach).round('whole'), R(centsEach + 5)],
        explain: `${money(price)} = ${size * centsEach}¢; ÷ ${size} = ${centsEach}¢`,
      };
    },
  }),
];
