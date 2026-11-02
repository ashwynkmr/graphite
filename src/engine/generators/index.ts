import type { Template } from './types';
import { algebra } from './topics/algebra';
import { arithmetic } from './topics/arithmetic';
import { averages } from './topics/averages';
import { estimation } from './topics/estimation';
import { exponents } from './topics/exponents';
import { fractions } from './topics/fractions';
import { geometry } from './topics/geometry';
import { moneyTopic } from './topics/money';
import { numbers } from './topics/numbers';
import { percents } from './topics/percents';
import { probability } from './topics/probability';
import { ratios } from './topics/ratios';
import { rates } from './topics/rates';
import { statistics } from './topics/statistics';

export const TEMPLATES: Template[] = [...arithmetic, ...fractions, ...percents, ...ratios, ...averages, ...rates, ...moneyTopic, ...exponents, ...estimation, ...numbers, ...statistics, ...probability, ...algebra, ...geometry];

export const TEMPLATE_BY_ID: ReadonlyMap<string, Template> = new Map(TEMPLATES.map((t) => [t.id, t]));
