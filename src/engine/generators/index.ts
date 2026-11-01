import type { Template } from './types';
import { arithmetic } from './topics/arithmetic';
import { averages } from './topics/averages';
import { estimation } from './topics/estimation';
import { exponents } from './topics/exponents';
import { fractions } from './topics/fractions';
import { moneyTopic } from './topics/money';
import { percents } from './topics/percents';
import { ratios } from './topics/ratios';
import { rates } from './topics/rates';

export const TEMPLATES: Template[] = [...arithmetic, ...fractions, ...percents, ...ratios, ...averages, ...rates, ...moneyTopic, ...exponents, ...estimation];

export const TEMPLATE_BY_ID: ReadonlyMap<string, Template> = new Map(TEMPLATES.map((t) => [t.id, t]));
