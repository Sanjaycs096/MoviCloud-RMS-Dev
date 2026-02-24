import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/app/components/ui/utils';
import {
  ChefHat,
  Flame,
  UtensilsCrossed,
  Soup,
  Coffee,
  Salad,
  Crown,
  Delete,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export type KitchenTerminalStation =
  | 'FRY'
  | 'CURRY'
  | 'RICE'
  | 'PREP'
  | 'GRILL'
  | 'DESSERT'
  | 'HEAD_CHEF';
// Note: In a real application, PINs would be securely stored and verified on the backend
interface StationCard {
  id: KitchenTerminalStation;
  name: string;
  icon: ReactNode;
  color: string;
  description: string;
  isHeadChef?: boolean;
}

export const TERMINAL_STATIONS: StationCard[] = [
  {
    id: 'FRY',
    name: 'Fry Station',
    icon: <Flame className="h-8 w-8" />,
    color: '#FF6B35',
    description: 'Deep-fry, saute, tempura',
  },
  {
    id: 'CURRY',
    name: 'Curry Station',
    icon: <Soup className="h-8 w-8" />,
    color: '#D4A574',
    description: 'Gravies, curries, sauces',
  },
  {
    id: 'RICE',
    name: 'Rice Station',
    icon: <UtensilsCrossed className="h-8 w-8" />,
    color: '#8B7355',
    description: 'Biryani, pulao, fried rice',
  },
  {
    id: 'PREP',
    name: 'Prep Station',
    icon: <Salad className="h-8 w-8" />,
    color: '#4CAF50',
    description: 'Salads, cold items, plating',
  },
  {
    id: 'GRILL',
    name: 'Grill Station',
    icon: <ChefHat className="h-8 w-8" />,
    color: '#E63946',
    description: 'Tandoor, BBQ, grills',
  },
  {
    id: 'DESSERT',
    name: 'Dessert Station',
    icon: <Coffee className="h-8 w-8" />,
    color: '#F4A261',
    description: 'Sweets, beverages, desserts',
  },
  {
    id: 'HEAD_CHEF',
    name: 'Head Chef (Master View)',
    icon: <Crown className="h-8 w-8" />,
    color: '#8B5A2B',
    description: 'Global oversight across all stations',
    isHeadChef: true,
  },
];

const MOCK_PINS: Record<KitchenTerminalStation, string> = {
  FRY: '1234',
  CURRY: '2345',
  RICE: '3456',
  PREP: '4567',
  GRILL: '5678',
  DESSERT: '6789',
  HEAD_CHEF: '9999',
};

interface KDSTerminalLoginProps {
  onLogin: (station: KitchenTerminalStation) => void;
}

export function KDSTerminalLogin({ onLogin }: KDSTerminalLoginProps) {
  const [selectedStation, setSelectedStation] = useState<KitchenTerminalStation | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
      setError('');
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleLogin = () => {
    if (!selectedStation) {
      setError('Please select a station');
      return;
    }

    if (pin.length !== 4) {
      setError('Please enter 4-digit PIN');
      return;
    }

    setIsAuthenticating(true);

    setTimeout(() => {
      if (pin === MOCK_PINS[selectedStation]) {
        const station = TERMINAL_STATIONS.find((s) => s.id === selectedStation);
        toast.success(`Logged in to ${station?.name}`, {
          description: 'Welcome, Chef! Your terminal is ready.',
        });
        onLogin(selectedStation);
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
        toast.error('Authentication Failed', {
          description: 'Incorrect PIN entered.',
        });
      }
      setIsAuthenticating(false);
    }, 800);
  };

  return (
    <div className="bg-kitchen-display-module min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-[#8B5A2B] rounded-2xl mb-4 shadow-2xl">
            <ChefHat className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-3" style={{ color: '#F5E6D3' }}>
            Chef Terminal Login
          </h1>
          <p className="text-xl text-white/80">Kitchen Display System • Terminal Login</p>
        </div>

        <Card className="bg-white border-none shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-8 bg-gradient-to-br from-[#FDFCFB] to-[#F5F3F0] border-r">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Select Your Station</h2>
                  <p className="text-sm text-[#6B6B6B]">Choose your kitchen terminal</p>
                </div>

                <div className="space-y-3">
                  {TERMINAL_STATIONS.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => {
                        setSelectedStation(station.id);
                        setPin('');
                        setError('');
                      }}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        selectedStation === station.id
                          ? 'border-[#8B5A2B] bg-white shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="p-3 rounded-lg flex-shrink-0"
                          style={{
                            backgroundColor:
                              selectedStation === station.id ? station.color : `${station.color}20`,
                            color: selectedStation === station.id ? 'white' : station.color,
                          }}
                        >
                          {station.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-base text-[#2D2D2D]">{station.name}</h3>
                            {station.isHeadChef && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs">
                                SENIOR
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#6B6B6B]">{station.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-white">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Enter Security PIN</h2>
                  <p className="text-sm text-[#6B6B6B]">Authenticate with your 4-digit terminal code</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-200',
                          pin.length > i ? 'border-[#8B5A2B] bg-[#8B5A2B] shadow-lg' : 'border-gray-300 bg-gray-50'
                        )}
                      >
                        {pin.length > i ? <div className="w-4 h-4 rounded-full bg-white" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="flex items-center justify-center gap-2 text-red-600 text-sm mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <Button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      disabled={isAuthenticating}
                      className="h-16 text-2xl font-bold bg-gray-100 hover:bg-gray-200 text-[#2D2D2D] border-2 border-gray-300 hover:border-[#8B5A2B] rounded-xl"
                    >
                      {num}
                    </Button>
                  ))}

                  <Button onClick={handleClear} disabled={isAuthenticating} className="h-16 bg-gray-100 hover:bg-gray-200 text-[#6B6B6B] border-2 border-gray-300 rounded-xl">
                    <Delete className="h-5 w-5" />
                  </Button>

                  <Button
                    onClick={() => handleNumberClick('0')}
                    disabled={isAuthenticating}
                    className="h-16 text-2xl font-bold bg-gray-100 hover:bg-gray-200 text-[#2D2D2D] border-2 border-gray-300 hover:border-[#8B5A2B] rounded-xl"
                  >
                    0
                  </Button>

                  <Button onClick={handleBackspace} disabled={isAuthenticating} className="h-16 bg-gray-100 hover:bg-gray-200 text-[#6B6B6B] border-2 border-gray-300 rounded-xl">
                    ←
                  </Button>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={!selectedStation || pin.length !== 4 || isAuthenticating}
                  className="w-full h-14 bg-[#8B5A2B] hover:bg-[#6D421E] text-white text-lg font-semibold rounded-xl shadow-lg disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      Access Terminal
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
