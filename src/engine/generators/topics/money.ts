import { R, Rational } from '../../matching/rational';
import { money, num, pct } from '../format';
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

export const moneyTopic: Template[] = [
  t({
    id: 'mo-discount',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const item = rng.pick(ITEMS);
      const price = R(by(d, rng.int(2, 25) * 20, rng.int(2, 30) * 8, rng.int(2, 25) * 20));
      if (d === 3) {
        const p1 = pickR(rng, ['10', '20', '25', '30', '40']);
        const p2 = pickR(rng, ['10', '20', '25']);
        const after1 = price.mul(R(1).sub(rate(p1)));
        const ans = after1.mul(R(1).sub(rate(p2)));
        if (!cents(ans)) return null;
        return {
          prompt: `A ${money(price)} ${item} is ${pct(p1)} off, with an extra ${pct(p2)} off the sale price at checkout. What is the final price?`,
          answer: ans,
          unit: USD,
          distractors: [price.mul(R(1).sub(rate(p1.add(p2)))), price.sub(ans), after1, ans.add(R(10))],
          explain: `${money(price)} × ${num(R(1).sub(rate(p1)))} = ${money(after1)}; × ${num(R(1).sub(rate(p2)))} = ${money(ans)}`,
        };
      }
      const p = pickR(rng, by(d, ['10', '20', '25', '50'], ['15', '30', '35', '40', '12.5'], []));
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
      const cost = R(by(d, rng.int(2, 20) * 10, rng.int(2, 25) * 8, rng.int(2, 25) * 20));
      if (d === 3) {
        const up = pickR(rng, ['20', '25', '40', '50', '60']);
        const down = pickR(rng, ['10', '20', '25']);
        const marked = cost.mul(R(1).add(rate(up)));
        const ans = marked.mul(R(1).sub(rate(down)));
        if (!cents(ans)) return null;
        return {
          prompt: `A store buys a ${item} for ${money(cost)}, marks it up ${pct(up)}, then sells it at ${pct(down)} off the marked price. What is the selling price?`,
          answer: ans,
          unit: USD,
          distractors: [cost.mul(R(1).add(rate(up.sub(down)))), marked, ans.sub(cost), ans.add(R(10))],
          explain: `${money(cost)} × ${num(R(1).add(rate(up)))} = ${money(marked)}; × ${num(R(1).sub(rate(down)))} = ${money(ans)}`,
        };
      }
      const p = pickR(rng, by(d, ['10', '20', '25', '50'], ['15', '35', '40', '60', '12.5'], []));
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
    },
  }),

  t({
    id: 'mo-profit-percent',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const p = pickR(rng, by(d, ['10', '20', '25', '50'], ['15', '30', '40', '12.5', '60'], ['20', '25', '50', '60', '100']));
      const cost = R(by(d, rng.int(2, 20) * 10, rng.int(2, 20) * 40, rng.int(2, 20) * 10));
      const loss = d === 2 && rng.chance(0.3);
      const sell = cost.mul(R(1).add(loss ? rate(p).neg() : rate(p)));
      if (!cents(sell)) return null;
      const diff = loss ? cost.sub(sell) : sell.sub(cost);
      if (d === 3) {
        // Profit as a percent of the selling price: the classic wrong-base trap reversed.
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
      const P = R(by(d, rng.int(1, 20) * 100, rng.int(1, 40) * 100, rng.int(2, 40) * 200));
      const r = pickR(rng, by(d, ['2', '5', '10'], ['3', '4', '6', '2.5'], ['3.5', '7.5', '4.5', '6']));
      const months = d === 3 ? rng.pick([6, 9, 18, 30]) : 0;
      const years = d === 3 ? R(months, 12) : R(rng.int(by(d, 1, 2, 0), by(d, 3, 5, 0)));
      const interest = P.mul(rate(r)).mul(years);
      if (!cents(interest)) return null;
      const askTotal = d === 2;
      const ans = askTotal ? P.add(interest) : interest;
      const time = d === 3 ? `${months} months` : `${num(years)} year${years.equals(R(1)) ? '' : 's'}`;
      const compound = P.mul(R(1).add(rate(r)).pow(Number(years.n / years.d) || 1)).sub(P);
      return {
        prompt: `${money(P)} earns ${pct(r)} simple interest per year. ${askTotal ? `What is the total after ${time}?` : `How much interest is earned in ${time}?`}`,
        answer: ans,
        unit: USD,
        distractors: askTotal
          ? [interest, P.add(P.mul(rate(r))), P.add(compound), ans.add(R(100))]
          : [P.mul(rate(r)), P.add(interest), interest.mul(R(10)), interest.add(R(10))],
        explain: `${money(P)} × ${num(rate(r))} × ${num(years)} = ${money(interest)}${askTotal ? `; + ${money(P)} = ${money(ans)}` : ''}`,
      };
    },
  }),

  t({
    id: 'mo-compound',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const P = R(by(d, rng.pick([100, 200, 500, 1000, 2000, 3000]), rng.pick([400, 800, 1000, 2000, 4000, 5000]), rng.pick([1000, 2500, 4000, 5000, 10000])));
      const semi = d === 3 && rng.chance(0.4);
      const r = pickR(rng, by(d, ['10'], ['5', '20'], semi ? ['10', '20', '8'] : ['4', '8', '15', '25']));
      const per = semi ? rate(r).div(R(2)) : rate(r);
      const ans = P.mul(R(1).add(per).pow(2));
      if (!cents(ans)) return null;
      const simple = P.mul(R(1).add(per.mul(R(2))));
      return {
        prompt: semi
          ? `${money(P)} is invested at ${pct(r)} a year, compounded every 6 months. What is it worth after 1 year?`
          : `${money(P)} is invested at ${pct(r)} a year, compounded yearly. What is it worth after 2 years?`,
        answer: ans,
        unit: USD,
        distractors: [simple, ans.sub(P), P.mul(R(1).add(per)), ans.add(R(by(d, 10, 50, 100)))],
        explain: `${money(P)} × ${num(R(1).add(per))} × ${num(R(1).add(per))} = ${money(ans)}`,
      };
    },
  }),

  t({
    id: 'mo-tip-tax',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const what = rng.pick(['A dinner bill', 'A haircut', 'A taxi fare', 'A food delivery', 'A café order']);
      const bill = R(by(d, rng.int(2, 15) * 10, rng.int(5, 40) * 4, rng.int(2, 8) * 25));
      if (d === 3) {
        const tax = pickR(rng, ['8', '6', '5', '10']);
        const tip = pickR(rng, ['15', '20', '18']);
        const ans = bill.mul(R(1).add(rate(tax)).add(rate(tip)));
        if (!cents(ans)) return null;
        const tipOnTaxed = bill.mul(R(1).add(rate(tax))).mul(R(1).add(rate(tip)));
        return {
          prompt: `${what} is ${money(bill)} before tax. Tax is ${pct(tax)}, and a ${pct(tip)} tip is added on the pre-tax amount. What is the total?`,
          answer: ans,
          unit: USD,
          distractors: [tipOnTaxed, bill.mul(rate(tax.add(tip))), bill.mul(R(1).add(rate(tip))), ans.add(R(1))],
          explain: `${money(bill)} × (1 + ${num(rate(tax))} + ${num(rate(tip))}) = ${money(bill)} × ${num(R(1).add(rate(tax)).add(rate(tip)))} = ${money(ans)}`,
        };
      }
      const tip = pickR(rng, by(d, ['10', '20'], ['15', '18', '25'], []));
      const tipAmt = bill.mul(rate(tip));
      const total = bill.add(tipAmt);
      const split = d === 2 && rng.chance(0.5) ? rng.pick([2, 4, 5]) : 1;
      const ans = total.div(R(split));
      if (!cents(ans)) return null;
      return {
        prompt: `${what} is ${money(bill)}. With a ${pct(tip)} tip${split > 1 ? `, split equally among ${split} people` : ''}, what is the ${split > 1 ? 'cost per person' : 'total'}?`,
        answer: ans,
        unit: USD,
        distractors: split > 1 ? [total, bill.div(R(split)), tipAmt, ans.add(R(1))] : [tipAmt, bill.add(tip), bill.mul(R(1).add(rate(tip.add(R(5))))), ans.add(R(1))],
        explain: `${pct(tip)} of ${money(bill)} is ${money(tipAmt)}; total ${money(total)}${split > 1 ? `; ÷ ${split} = ${money(ans)}` : ''}`,
      };
    },
  }),

  t({
    id: 'mo-commission',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const name = rng.pick(NAMES);
      if (d === 3) {
        const tier = R(rng.pick([5000, 10000, 20000]));
        const sales = tier.add(R(rng.int(1, 30) * 500));
        const r1 = pickR(rng, ['4', '5', '6']);
        const r2 = pickR(rng, ['8', '10', '12']);
        const ans = tier.mul(rate(r1)).add(sales.sub(tier).mul(rate(r2)));
        return {
          prompt: `${name} earns ${pct(r1)} commission on the first ${money(tier)} of sales and ${pct(r2)} on sales above that. How much commission on ${money(sales)} of sales?`,
          answer: ans,
          unit: USD,
          distractors: [sales.mul(rate(r2)), sales.mul(rate(r1)), sales.mul(rate(r1.add(r2))), ans.add(R(100))],
          explain: `${money(tier)} × ${num(rate(r1))} = ${money(tier.mul(rate(r1)))}; ${money(sales.sub(tier))} × ${num(rate(r2))} = ${money(sales.sub(tier).mul(rate(r2)))}; total ${money(ans)}`,
        };
      }
      const base = R(by(d, rng.int(1, 5) * 100, rng.int(2, 10) * 50, 0));
      const r = pickR(rng, by(d, ['10', '5'], ['4', '6', '8', '3'], []));
      const sales = R(by(d, rng.int(5, 50) * 100, rng.int(10, 90) * 100, 0));
      const comm = sales.mul(rate(r));
      const ans = base.add(comm);
      return {
        prompt: `${name} earns ${money(base)} a week plus ${pct(r)} commission on sales. What is ${name}'s pay in a week with ${money(sales)} of sales?`,
        answer: ans,
        unit: USD,
        distractors: [comm, base.add(sales).mul(rate(r)), base.add(comm.mul(R(10))), ans.add(R(10))],
        explain: `${pct(r)} of ${money(sales)} is ${money(comm)}; + ${money(base)} = ${money(ans)}`,
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
      const size = by(d, rng.pick([2, 4, 5, 10]), rng.pick([6, 8, 12, 16, 20]), rng.pick([12, 16, 24, 32]));
      const centsEach = by(d, rng.int(5, 60), rng.int(12, 95), rng.int(8, 60));
      const price = R(size * centsEach, 100);
      if (d === 3) {
        const want = rng.int(2, 30);
        if (want === size) return null;
        const ans = R(want * centsEach, 100);
        return {
          prompt: `A ${size}-${unit} ${thing} costs ${money(price)}. At the same rate, how much do ${want} ${unitPlural} cost?`,
          answer: ans,
          unit: USD,
          distractors: [price.mul(R(size, want)), price.add(R(want - size, 100)), ans.mul(R(10)), ans.add(R(1, 10))],
          explain: `${money(price)} ÷ ${size} = ${centsEach}¢ per ${unit}; × ${want} = ${money(ans)}`,
        };
      }
      return {
        prompt: `A ${size}-${unit} ${thing} costs ${money(price)}. What is the price per ${unit}, in cents?`,
        answer: R(centsEach),
        unit: { suffix: '¢' },
        distractors: [R(centsEach * 10), R(centsEach, 10).round('whole'), R(size * 100, centsEach).round('whole'), R(centsEach + 5)],
        explain: `${money(price)} = ${size * centsEach}¢; ÷ ${size} = ${centsEach}¢`,
      };
    },
  }),
];
