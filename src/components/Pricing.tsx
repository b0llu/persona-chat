import React from 'react';
import { Button } from './ui/button';
import { LucideCheckCircle } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Get started with Persona Chat for free. Perfect for casual use and exploring features.',
    features: [
      'Basic chat capabilities',
      'Limited message history',
      'Access to public personas',
      'Light & dark mode',
    ],
    cta: 'Your current plan',
    highlight: false,
    disabled: true,
    current: true,
  },
  {
    name: 'Pro Monthly',
    price: '$9',
    period: '/month',
    description: 'Unlock unlimited chats, priority support, and all premium features. Cancel anytime.',
    features: [
      'Unlimited chats',
      'Priority support',
      'Early access to new features',
      'All Free plan features',
    ],
    cta: 'Upgrade to Pro',
    highlight: false,
    disabled: false,
    current: false,
  },
  {
    name: 'Lifetime Access',
    price: '$99',
    period: ' one-time',
    description: 'Pay once, use forever. Best value for power users and long-term savings.',
    features: [
      'Unlimited chats',
      'Lifetime updates',
      'Priority support',
      'All Pro Monthly features',
    ],
    cta: 'Get Lifetime',
    highlight: true,
    disabled: false,
    current: false,
  },
];

const PricingCard: React.FC<{
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  disabled?: boolean;
  current?: boolean;
}> = ({ name, price, period, description, features, cta, highlight, disabled, current }) => (
  <div
    className={`flex flex-col gap-6 rounded-xl p-8 bg-card text-card-foreground shadow-md border border-border relative min-h-[500px] ${
      highlight ? 'ring-2 ring-primary z-10' : ''
    } ${disabled ? 'opacity-80' : ''}`}
  >
    {current && (
      <span className="absolute top-4 right-4 bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">Your current plan</span>
    )}
    <h3 className="text-2xl font-bold mb-2">{name}</h3>
    <div className="flex items-end mb-2">
      <span className="text-4xl font-extrabold">{price}</span>
      <span className="text-lg text-muted-foreground ml-1">{period}</span>
    </div>
    <p className="text-muted-foreground mb-4 min-h-[48px]">{description}</p>
    <ul className="flex flex-col gap-2 mb-6 flex-1">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-2">
          <LucideCheckCircle className="w-5 h-5 text-primary" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Button variant="outline" size="lg" className="w-full mt-auto" disabled={disabled}>
      {cta}
    </Button>
  </div>
);

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-16 px-4">
      <h1 className="text-4xl font-bold mb-4 text-foreground">Upgrade your plan</h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-xl text-center">
        You are currently using the <span className="font-semibold text-foreground">Free</span> plan. Unlock more features by upgrading below.
      </p>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center items-stretch">
        {plans.map((plan) => (
          <PricingCard key={plan.name} {...plan} />
        ))}
      </div>
    </div>
  );
};

export default Pricing; 