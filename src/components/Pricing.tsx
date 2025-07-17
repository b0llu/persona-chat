import React from 'react';
import { Button } from './ui/button';
import { LucideCheckCircle } from 'lucide-react';

const plans = [
  {
    name: 'Pro Monthly',
    price: '$9',
    period: '/month',
    description: 'Best for regular users who want flexibility and monthly updates.',
    features: [
      'Unlimited chats',
      'Priority support',
      'Early access to new features',
      'Cancel anytime',
    ],
    cta: 'Subscribe',
    highlight: false,
  },
  {
    name: 'Lifetime Access',
    price: '$99',
    period: ' one-time',
    description: 'Pay once, use forever. Perfect for power users and long-term savings.',
    features: [
      'Unlimited chats',
      'Lifetime updates',
      'Priority support',
      'All future features included',
    ],
    cta: 'Buy Now',
    highlight: true,
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
}> = ({ name, price, period, description, features, cta, highlight }) => (
  <div
    className={`flex flex-col gap-6 rounded-xl p-8 bg-card text-card-foreground shadow-md transition-transform hover:scale-105 ${
      highlight ? 'ring-2 ring-primary' : ''
    }`}
  >
    <h3 className="text-2xl font-bold mb-2">{name}</h3>
    <div className="flex items-end mb-2">
      <span className="text-4xl font-extrabold">{price}</span>
      <span className="text-lg text-muted-foreground ml-1">{period}</span>
    </div>
    <p className="text-muted-foreground mb-4">{description}</p>
    <ul className="flex flex-col gap-2 mb-6">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-2">
          <LucideCheckCircle className="w-5 h-5 text-primary" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Button variant="outline" size="lg" className="w-full" disabled>
      {cta}
    </Button>
  </div>
);

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-16 px-4">
      <h1 className="text-4xl font-bold mb-4 text-foreground">Choose Your Plan</h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-xl text-center">
        Unlock the full power of Persona Chat. Pick the plan that fits your needs and start chatting smarter today.
      </p>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-3xl justify-center">
        {plans.map((plan) => (
          <PricingCard key={plan.name} {...plan} />
        ))}
      </div>
    </div>
  );
};

export default Pricing; 