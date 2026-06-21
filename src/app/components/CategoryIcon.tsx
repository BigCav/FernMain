import {
  Home, Utensils, Car, Tv, ShoppingBag, Heart, Zap, TrendingUp, PiggyBank,
} from 'lucide-react';
import type { CategoryKey } from '../data/mockData';

interface CategoryIconProps {
  category: CategoryKey;
  color: string;
  size?: number;
}

export function CategoryIcon({ category, color, size = 16 }: CategoryIconProps) {
  const props = { style: { color }, width: size, height: size };
  switch (category) {
    case 'housing':       return <Home {...props} />;
    case 'food':          return <Utensils {...props} />;
    case 'transport':     return <Car {...props} />;
    case 'entertainment': return <Tv {...props} />;
    case 'shopping':      return <ShoppingBag {...props} />;
    case 'health':        return <Heart {...props} />;
    case 'utilities':     return <Zap {...props} />;
    case 'income':        return <TrendingUp {...props} />;
    case 'savings':       return <PiggyBank {...props} />;
    default:              return <TrendingUp {...props} />;
  }
}
