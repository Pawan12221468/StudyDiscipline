import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Home, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        The study path you are looking for does not exist or has moved. Return to the timer to resume your focus schedule.
      </p>
      <Button
        onClick={() => navigate('/timer')}
        icon={<Home className="w-4 h-4" />}
      >
        Back to Timer
      </Button>
    </div>
  );
};
