import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Save, Settings, Trophy, Clock, Calendar, Zap, Heart, Moon, Users, Briefcase, Home, Utensils, Dumbbell, Bath, Gamepad2, Bed, Monitor, Sofa, Tv, BookOpen, Car, Smartphone, Coffee, ShowerHead as Shower, Sparkles } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface DreamStoryGameProps {
  onBack: () => void;
}

interface GameState {
  day: number;
  hour: number;
  minute: number;
  currentRoom: string;
  factors: {
    health: number;
    sleep: number;
    energy: number;
    productivity: number;
    social: number;
  };
  score: number;
  isPlaying: boolean;
  gameSpeed: number;
  completedActivities: string[];
  currentActivity: string | null;
  activityProgress: number;
  activityDuration: number;
}

interface Situation {
  id: string;
  day: number;
  hour: number;
  minute: number;
  title: string;
  description: string;
  icon: string;
  yesOption: {
    effects: {
      health?: number;
      sleep?: number;
      energy?: number;
      productivity?: number;
      social?: number;
    };
    score: number;
    timeJump?: { hour: number; minute: number; day?: number };
    consequence: string;
  };
  noOption: {
    effects: {
      health?: number;
      sleep?: number;
      energy?: number;
      productivity?: number;
      social?: number;
    };
    score: number;
    timeJump?: { hour: number; minute: number; day?: number };
    consequence: string;
  };
}

const situations: Situation[] = [
  {
    id: 'early_meeting',
    day: 1,
    hour: 7,
    minute: 0,
    title: 'Reunião Matinal',
    description: 'Seu chefe pediu para você chegar 1h mais cedo no trabalho para uma reunião importante.',
    icon: '💼',
    yesOption: {
      effects: { productivity: 15, sleep: -20, energy: -10 },
      score: 10,
      timeJump: { hour: 9, minute: 0 },
      consequence: 'Alex chegou cedo, participou da reunião e impressionou o chefe, mas ficou com sono o dia todo.'
    },
    noOption: {
      effects: { productivity: -10 },
      score: -20,
      timeJump: { hour: 8, minute: 0 },
      consequence: 'Alex ignorou a mensagem do chefe e chegou no horário normal. Foi notado negativamente no trabalho.'
    }
  },
  {
    id: 'traffic_walk',
    day: 3,
    hour: 18,
    minute: 0,
    title: 'Trânsito Parado',
    description: 'O trânsito está parado. Você pode ir pela rota mais longa a pé ou esperar no carro.',
    icon: '🚗',
    yesOption: {
      effects: { health: 10, energy: -15, productivity: 5 },
      score: 5,
      timeJump: { hour: 19, minute: 0 },
      consequence: 'Alex caminhou por quase 1 hora, se exercitou, mas chegou suado e cansado.'
    },
    noOption: {
      effects: { energy: -5, productivity: -5 },
      score: -10,
      timeJump: { hour: 20, minute: 0 },
      consequence: 'Alex ficou preso no trânsito e se estressou, chegando atrasado.'
    }
  },
  {
    id: 'party_invitation',
    day: 6,
    hour: 21,
    minute: 0,
    title: 'Festa com Amigos',
    description: 'Alex foi chamado para uma festa com os amigos que promete ir até tarde.',
    icon: '🎉',
    yesOption: {
      effects: { social: 20, health: -10, sleep: -25, energy: -20 },
      score: -10,
      timeJump: { hour: 5, minute: 0, day: 7 },
      consequence: 'Alex se divertiu até tarde com os amigos, mas virou a noite.'
    },
    noOption: {
      effects: { social: -10, productivity: 10, sleep: 15 },
      score: 10,
      timeJump: { hour: 6, minute: 0, day: 7 },
      consequence: 'Alex recusou a festa e aproveitou para descansar e colocar a vida em ordem.'
    }
  },
  {
    id: 'family_lunch',
    day: 7,
    hour: 11,
    minute: 0,
    title: 'Almoço em Família',
    description: 'Alex pode visitar seus pais para um almoço de família especial.',
    icon: '👨‍👩‍👦',
    yesOption: {
      effects: { social: 15, productivity: -5, energy: -10 },
      score: 5,
      timeJump: { hour: 15, minute: 0 },
      consequence: 'Alex teve um almoço agradável com os pais, mas perdeu tempo para tarefas pessoais.'
    },
    noOption: {
      effects: { social: -5, productivity: 10 },
      score: 5,
      timeJump: { hour: 13, minute: 0 },
      consequence: 'Alex decidiu ficar em casa e organizou sua semana.'
    }
  },
  {
    id: 'afternoon_nap',
    day: 9,
    hour: 16,
    minute: 0,
    title: 'Soneca da Tarde',
    description: 'Alex está exausto. Uma soneca rápida de 1 hora pode ajudar a recuperar as energias.',
    icon: '😴',
    yesOption: {
      effects: { sleep: 20, energy: 15, productivity: -10 },
      score: 5,
      timeJump: { hour: 17, minute: 0 },
      consequence: 'Alex cochilou e acordou renovado, mas perdeu o ritmo de trabalho.'
    },
    noOption: {
      effects: { sleep: -15, energy: -10, productivity: 10 },
      score: 10,
      timeJump: { hour: 17, minute: 0 },
      consequence: 'Alex resistiu ao cansaço e finalizou todas as suas tarefas.'
    }
  },
  {
    id: 'forgotten_lunch',
    day: 11,
    hour: 12,
    minute: 0,
    title: 'Almoço Esquecido',
    description: 'Alex esqueceu o almoço em casa. Pode comprar algo rápido na rua ou ficar sem comer.',
    icon: '🍽️',
    yesOption: {
      effects: { health: -10, energy: 10, productivity: 5 },
      score: 0,
      timeJump: { hour: 13, minute: 0 },
      consequence: 'Alex comeu algo rápido e industrializado, mas voltou ao trabalho com energia.'
    },
    noOption: {
      effects: { health: -20, energy: -20, productivity: -10 },
      score: -10,
      timeJump: { hour: 15, minute: 0 },
      consequence: 'Alex ficou o dia inteiro sem comer e não rendeu nada.'
    }
  },
  {
    id: 'romantic_date',
    day: 12,
    hour: 19,
    minute: 0,
    title: 'Encontro Romântico',
    description: 'Alex foi convidado para um encontro romântico com uma colega do trabalho.',
    icon: '💕',
    yesOption: {
      effects: { social: 10, health: -5, sleep: -10, energy: -10 },
      score: 15,
      timeJump: { hour: 23, minute: 0 },
      consequence: 'Alex saiu, se divertiu e terminou a noite com um beijo. Promissor.'
    },
    noOption: {
      effects: { social: -10, energy: 5, productivity: 10 },
      score: 0,
      timeJump: { hour: 21, minute: 0 },
      consequence: 'Alex recusou o encontro e ficou em casa focado nos estudos.'
    }
  },
  {
    id: 'help_colleague',
    day: 8,
    hour: 14,
    minute: 0,
    title: 'Ajuda ao Colega',
    description: 'Um colega de trabalho pediu ajuda para terminar uma tarefa em equipe urgente.',
    icon: '🤝',
    yesOption: {
      effects: { productivity: 10, energy: -10, social: 5 },
      score: 5,
      timeJump: { hour: 15, minute: 0 },
      consequence: 'Alex ajudou o colega e foi elogiado por sua colaboração.'
    },
    noOption: {
      effects: { social: -10 },
      score: -5,
      timeJump: { hour: 14, minute: 30 },
      consequence: 'Alex ignorou o pedido e acabou sendo visto como pouco colaborativo.'
    }
  },
  {
    id: 'morning_run',
    day: 10,
    hour: 6,
    minute: 0,
    title: 'Corrida Matinal',
    description: 'Alex pode acordar cedo e ir correr no parque antes do trabalho.',
    icon: '🏃‍♂️',
    yesOption: {
      effects: { health: 20, sleep: -20, energy: 10 },
      score: 10,
      timeJump: { hour: 7, minute: 30 },
      consequence: 'Alex correu 5km e começou o dia com disposição.'
    },
    noOption: {
      effects: { health: -5, sleep: 10 },
      score: 0,
      timeJump: { hour: 8, minute: 0 },
      consequence: 'Alex ficou mais um tempo na cama, mas perdeu a chance de se exercitar.'
    }
  },
  {
    id: 'movie_night',
    day: 14,
    hour: 20,
    minute: 0,
    title: 'Noite de Filme',
    description: 'Alex pode assistir a um filme sozinho para relaxar antes da semana começar.',
    icon: '🎬',
    yesOption: {
      effects: { social: 5, sleep: -10, energy: -5 },
      score: 5,
      timeJump: { hour: 22, minute: 0 },
      consequence: 'Alex assistiu a um filme envolvente e terminou o domingo relaxado.'
    },
    noOption: {
      effects: { productivity: 5, sleep: 10 },
      score: 5,
      timeJump: { hour: 5, minute: 0, day: 15 },
      consequence: 'Alex dormiu cedo e se preparou bem para a segunda-feira.'
    }
  },
  {
    id: 'impulse_shopping',
    day: 5,
    hour: 15,
    minute: 0,
    title: 'Compras por Impulso',
    description: 'Alex viu uma promoção irresistível online. Pode gastar dinheiro em algo que não precisa.',
    icon: '🛒',
    yesOption: {
      effects: { social: 5, productivity: -15, energy: -5 },
      score: -15,
      timeJump: { hour: 16, minute: 30 },
      consequence: 'Alex comprou várias coisas desnecessárias e se arrependeu depois.'
    },
    noOption: {
      effects: { productivity: 10, energy: 5 },
      score: 10,
      timeJump: { hour: 15, minute: 30 },
      consequence: 'Alex resistiu à tentação e se sentiu orgulhoso do autocontrole.'
    }
  },
  {
    id: 'headache_problem',
    day: 4,
    hour: 10,
    minute: 0,
    title: 'Dor de Cabeça',
    description: 'Alex acordou com uma forte dor de cabeça. Pode tomar remédio e descansar ou tentar trabalhar assim mesmo.',
    icon: '🤕',
    yesOption: {
      effects: { health: 10, energy: 5, productivity: -10 },
      score: 5,
      timeJump: { hour: 11, minute: 30 },
      consequence: 'Alex tomou remédio e descansou um pouco. A dor passou, mas perdeu tempo de trabalho.'
    },
    noOption: {
      effects: { health: -15, energy: -20, productivity: -15 },
      score: -10,
      timeJump: { hour: 12, minute: 0 },
      consequence: 'Alex tentou trabalhar com dor de cabeça e não conseguiu se concentrar em nada.'
    }
  },
  {
    id: 'friend_argument',
    day: 13,
    hour: 16,
    minute: 0,
    title: 'Briga com Amigo',
    description: 'Alex teve uma discussão séria com seu melhor amigo. Pode tentar resolver ou deixar para depois.',
    icon: '😠',
    yesOption: {
      effects: { social: 15, energy: -10, productivity: -5 },
      score: 10,
      timeJump: { hour: 18, minute: 0 },
      consequence: 'Alex conversou com o amigo, se desculparam mutuamente e a amizade ficou mais forte.'
    },
    noOption: {
      effects: { social: -20, energy: -15 },
      score: -15,
      timeJump: { hour: 16, minute: 30 },
      consequence: 'Alex ignorou o problema e ficou remoendo a briga o resto do dia.'
    }
  },
  {
    id: 'weekend_trip',
    day: 14,
    hour: 8,
    minute: 0,
    title: 'Viagem Bate-volta',
    description: 'Um amigo convidou Alex para uma viagem bate-volta para a praia no último dia do desafio.',
    icon: '🏖️',
    yesOption: {
      effects: { social: 25, health: 10, energy: -15, productivity: -20 },
      score: 15,
      timeJump: { hour: 22, minute: 0 },
      consequence: 'Alex foi à praia, se divertiu muito e terminou o desafio com uma experiência incrível.'
    },
    noOption: {
      effects: { social: -10, productivity: 15, sleep: 10 },
      score: 5,
      timeJump: { hour: 10, minute: 0 },
      consequence: 'Alex ficou em casa, organizou tudo para a próxima semana e refletiu sobre o desafio.'
    }
  }
];

const DreamStoryGame: React.FC<DreamStoryGameProps> = ({ onBack }) => {
  const { isDark } = useTheme();
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const [currentSituation, setCurrentSituation] = useState<Situation | null>(null);
  const [showConsequence, setShowConsequence] = useState<string | null>(null);
  const [triggeredSituations, setTriggeredSituations] = useState<Set<string>>(new Set());
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    day: 1,
    hour: 6,
    minute: 0,
    currentRoom: 'bedroom',
    factors: {
      health: 70,
      sleep: 60,
      energy: 50,
      productivity: 40,
      social: 30
    },
    score: 0,
    isPlaying: false,
    gameSpeed: 1,
    completedActivities: [],
    currentActivity: null,
    activityProgress: 0,
    activityDuration: 0
  });

  const rooms = {
    bedroom: { 
      name: 'Quarto', 
      icon: Bed,
      color: 'from-purple-500/20 to-indigo-500/20',
      activities: ['sleep', 'computer'] 
    },
    living: { 
      name: 'Sala', 
      icon: Sofa,
      color: 'from-green-500/20 to-emerald-500/20',
      activities: ['relax', 'videogame'] 
    },
    kitchen: { 
      name: 'Cozinha', 
      icon: Utensils,
      color: 'from-orange-500/20 to-red-500/20',
      activities: ['eat', 'drinkWater'] 
    },
    gym: { 
      name: 'Academia', 
      icon: Dumbbell,
      color: 'from-gray-500/20 to-slate-500/20',
      activities: ['exercise'] 
    },
    bathroom: { 
      name: 'Banheiro', 
      icon: Bath,
      color: 'from-blue-500/20 to-cyan-500/20',
      activities: ['shower', 'skincare'] 
    }
  };

  const activities = {
    sleep: { name: 'Dormir', duration: 480, effects: { sleep: 40, energy: 30, health: 10 }, icon: Moon, color: 'text-indigo-400' },
    eat: { name: 'Comer', duration: 30, effects: { health: 15, energy: 20 }, icon: Utensils, color: 'text-orange-400' },
    exercise: { name: 'Exercitar', duration: 60, effects: { health: 25, energy: -10, sleep: 10 }, icon: Dumbbell, color: 'text-red-400' },
    relax: { name: 'Relaxar', duration: 120, effects: { energy: 15, social: 5, sleep: 5 }, icon: Sofa, color: 'text-green-400' },
    drinkWater: { name: 'Beber Água', duration: 5, effects: { health: 10, energy: 5 }, icon: Coffee, color: 'text-blue-400' },
    shower: { name: 'Banho', duration: 20, effects: { health: 10, energy: 10, social: 5 }, icon: Shower, color: 'text-cyan-400' },
    computer: { name: 'Computador', duration: 90, effects: { productivity: 20, energy: -5, social: -5 }, icon: Monitor, color: 'text-purple-400' },
    videogame: { name: 'Videogame', duration: 120, effects: { energy: -5, social: 10, productivity: -10 }, icon: Gamepad2, color: 'text-pink-400' },
    skincare: { name: 'Cuidados', duration: 15, effects: { health: 5, social: 10 }, icon: Sparkles, color: 'text-yellow-400' }
  };

  const checkForSituations = (day: number, hour: number, minute: number) => {
    const situation = situations.find(s => 
      s.day === day && 
      s.hour === hour && 
      s.minute === minute && 
      !triggeredSituations.has(s.id)
    );

    if (situation) {
      setCurrentSituation(situation);
      setGameState(prev => ({ ...prev, isPlaying: false }));
      setTriggeredSituations(prev => new Set([...prev, situation.id]));
    }
  };

  const handleSituationChoice = (choice: 'yes' | 'no') => {
    if (!currentSituation) return;

    const option = choice === 'yes' ? currentSituation.yesOption : currentSituation.noOption;
    
    setGameState(prev => {
      const newFactors = { ...prev.factors };
      
      // Aplicar efeitos
      Object.entries(option.effects).forEach(([factor, change]) => {
        if (factor in newFactors) {
          newFactors[factor as keyof typeof newFactors] = Math.max(0, Math.min(100, 
            newFactors[factor as keyof typeof newFactors] + change
          ));
        }
      });

      // Aplicar salto de tempo se houver
      let newDay = prev.day;
      let newHour = prev.hour;
      let newMinute = prev.minute;

      if (option.timeJump) {
        newHour = option.timeJump.hour;
        newMinute = option.timeJump.minute;
        if (option.timeJump.day) {
          newDay = option.timeJump.day;
        }
      }

      return {
        ...prev,
        factors: newFactors,
        score: prev.score + option.score,
        day: newDay,
        hour: newHour,
        minute: newMinute
      };
    });

    // Mostrar consequência
    setShowConsequence(option.consequence);
    setCurrentSituation(null);
  };

  const saveGame = () => {
    const saveData = {
      gameState,
      triggeredSituations: Array.from(triggeredSituations),
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('dreamStoryGameSave', JSON.stringify(saveData));
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 2000);
  };

  const loadGame = () => {
    const savedData = localStorage.getItem('dreamStoryGameSave');
    if (savedData) {
      try {
        const { gameState: savedGameState, triggeredSituations: savedSituations } = JSON.parse(savedData);
        setGameState(savedGameState);
        setTriggeredSituations(new Set(savedSituations));
      } catch (error) {
        console.error('Erro ao carregar jogo:', error);
      }
    }
  };

  const startGameLoop = () => {
    if (gameLoopRef.current) return;
    
    gameLoopRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev.isPlaying) return prev;

        let newMinute = prev.minute + (5 * prev.gameSpeed);
        let newHour = prev.hour;
        let newDay = prev.day;

        if (newMinute >= 60) {
          newHour += Math.floor(newMinute / 60);
          newMinute = newMinute % 60;
        }

        if (newHour >= 24) {
          newDay += Math.floor(newHour / 24);
          newHour = newHour % 24;
        }

        // Verificar situações
        setTimeout(() => checkForSituations(newDay, newHour, newMinute), 100);

        // Degradação natural dos fatores
        const newFactors = { ...prev.factors };
        if (newMinute % 30 === 0) {
          newFactors.energy = Math.max(0, newFactors.energy - 1);
          newFactors.sleep = Math.max(0, newFactors.sleep - 0.5);
          if (newHour >= 22 || newHour <= 6) {
            newFactors.health = Math.max(0, newFactors.health - 0.5);
          }
        }

        // Processar atividade atual
        let newCurrentActivity = prev.currentActivity;
        let newActivityProgress = prev.activityProgress;
        let newCompletedActivities = [...prev.completedActivities];

        if (prev.currentActivity) {
          newActivityProgress += (5 * prev.gameSpeed);
          
          if (newActivityProgress >= prev.activityDuration) {
            const activity = activities[prev.currentActivity as keyof typeof activities];
            Object.entries(activity.effects).forEach(([factor, change]) => {
              if (factor in newFactors) {
                newFactors[factor as keyof typeof newFactors] = Math.max(0, Math.min(100, 
                  newFactors[factor as keyof typeof newFactors] + change
                ));
              }
            });
            
            newCompletedActivities.push(prev.currentActivity);
            newCurrentActivity = null;
            newActivityProgress = 0;
          }
        }

        return {
          ...prev,
          day: newDay,
          hour: newHour,
          minute: newMinute,
          factors: newFactors,
          currentActivity: newCurrentActivity,
          activityProgress: newActivityProgress,
          completedActivities: newCompletedActivities
        };
      });
    }, 1000);
  };

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  useEffect(() => {
    if (gameState.isPlaying) {
      startGameLoop();
    } else {
      stopGameLoop();
    }

    return () => stopGameLoop();
  }, [gameState.isPlaying, gameState.gameSpeed]);

  useEffect(() => {
    // Carregar jogo automaticamente ao iniciar
    loadGame();
  }, []);

  const toggleGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const resetGame = () => {
    stopGameLoop();
    setGameState({
      day: 1,
      hour: 6,
      minute: 0,
      currentRoom: 'bedroom',
      factors: {
        health: 70,
        sleep: 60,
        energy: 50,
        productivity: 40,
        social: 30
      },
      score: 0,
      isPlaying: false,
      gameSpeed: 1,
      completedActivities: [],
      currentActivity: null,
      activityProgress: 0,
      activityDuration: 0
    });
    setCurrentSituation(null);
    setShowConsequence(null);
    setTriggeredSituations(new Set());
    localStorage.removeItem('dreamStoryGameSave');
  };

  const changeRoom = (roomId: string) => {
    if (gameState.currentActivity) return;
    setGameState(prev => ({ ...prev, currentRoom: roomId }));
  };

  const startActivity = (activityId: string) => {
    if (gameState.currentActivity) return;
    
    const activity = activities[activityId as keyof typeof activities];
    setGameState(prev => ({
      ...prev,
      currentActivity: activityId,
      activityProgress: 0,
      activityDuration: activity.duration
    }));
  };

  const formatTime = (day: number, hour: number, minute: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayName = days[(day - 1) % 7];
    return `${dayName}, ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'health': return Heart;
      case 'sleep': return Moon;
      case 'energy': return Zap;
      case 'productivity': return Briefcase;
      case 'social': return Users;
      default: return Heart;
    }
  };

  const getFactorColor = (factor: string, value: number) => {
    const baseColors = {
      health: value >= 70 ? 'text-green-400' : value >= 40 ? 'text-yellow-400' : 'text-red-400',
      sleep: value >= 70 ? 'text-blue-400' : value >= 40 ? 'text-yellow-400' : 'text-red-400',
      energy: value >= 70 ? 'text-orange-400' : value >= 40 ? 'text-yellow-400' : 'text-red-400',
      productivity: value >= 70 ? 'text-purple-400' : value >= 40 ? 'text-yellow-400' : 'text-red-400',
      social: value >= 70 ? 'text-pink-400' : value >= 40 ? 'text-yellow-400' : 'text-red-400'
    };
    return baseColors[factor as keyof typeof baseColors] || 'text-gray-400';
  };

  const getFactorBgColor = (factor: string, value: number) => {
    const bgColors = {
      health: value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500',
      sleep: value >= 70 ? 'bg-blue-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500',
      energy: value >= 70 ? 'bg-orange-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500',
      productivity: value >= 70 ? 'bg-purple-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500',
      social: value >= 70 ? 'bg-pink-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
    };
    return bgColors[factor as keyof typeof bgColors] || 'bg-gray-500';
  };

  // Modal de Situação
  if (currentSituation) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-white via-emerald-50/80 to-emerald-100/60'
      }`}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-3xl p-8 border-2 transition-all duration-300 transform scale-100 ${
            isDark 
              ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-600 shadow-2xl' 
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-300 shadow-2xl'
          }`}>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">{currentSituation.icon}</span>
              </div>
              <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {currentSituation.title}
              </h3>
              <p className={`text-base leading-relaxed transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}>
                {currentSituation.description}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleSituationChoice('yes')}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                ✅ Sim
              </button>
              <button
                onClick={() => handleSituationChoice('no')}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 border-2 shadow-lg ${
                  isDark 
                    ? 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border-slate-600' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-900 border-gray-300'
                }`}
              >
                ❌ Não
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal de Consequência
  if (showConsequence) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-white via-emerald-50/80 to-emerald-100/60'
      }`}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-3xl p-8 border-2 transition-all duration-300 transform scale-100 ${
            isDark 
              ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-600 shadow-2xl' 
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-300 shadow-2xl'
          }`}>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">📖</span>
              </div>
              <h3 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Resultado
              </h3>
              <p className={`text-base leading-relaxed mb-8 transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}>
                {showConsequence}
              </p>
              <button
                onClick={() => {
                  setShowConsequence(null);
                  setGameState(prev => ({ ...prev, isPlaying: true }));
                }}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🎮 Continuar Jogo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-white via-emerald-50/80 to-emerald-100/60'
    }`}>
      {/* Header Melhorado */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b-2 transition-colors duration-300 ${
        isDark 
          ? 'bg-slate-900/95 border-slate-700' 
          : 'bg-white/95 border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Perfil do Alex */}
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  isDark 
                    ? 'hover:bg-slate-800 text-white' 
                    : 'hover:bg-gray-100 text-gray-900'
                }`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              {/* Avatar e Nome do Alex */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xl">👨‍💼</span>
                </div>
                <div>
                  <h2 className={`text-lg font-bold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Alex</h2>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}>Protagonista</p>
                </div>
              </div>
            </div>

            {/* Info do Jogo */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${
                isDark ? 'bg-slate-800' : 'bg-gray-100'
              }`}>
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Dia {gameState.day}
                </span>
              </div>
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${
                isDark ? 'bg-slate-800' : 'bg-gray-100'
              }`}>
                <Clock className="w-4 h-4 text-blue-400" />
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {gameState.hour.toString().padStart(2, '0')}:{gameState.minute.toString().padStart(2, '0')}
                </span>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${
                isDark ? 'bg-slate-800' : 'bg-gray-100'
              }`}>
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {gameState.score}
                </span>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <button
                onClick={saveGame}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  isDark 
                    ? 'hover:bg-slate-800 text-emerald-400' 
                    : 'hover:bg-gray-100 text-emerald-600'
                }`}
                title="Salvar Jogo"
              >
                <Save className="w-5 h-5" />
              </button>
              
              <button
                onClick={toggleGame}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  gameState.isPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {gameState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <button
                onClick={resetGame}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  isDark 
                    ? 'hover:bg-slate-800 text-orange-400' 
                    : 'hover:bg-gray-100 text-orange-600'
                }`}
                title="Resetar Jogo"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mensagem de Save */}
      {showSaveMessage && (
        <div className="fixed top-20 right-6 z-50">
          <div className={`px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
            isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Jogo salvo!</span>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Seção de Status Melhorada */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Fatores */}
          <div className="lg:col-span-2">
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Heart className="w-6 h-6 text-red-400" />
              Status de Alex
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(gameState.factors).map(([factor, value]) => {
                const IconComponent = getFactorIcon(factor);
                return (
                  <div
                    key={factor}
                    className={`backdrop-blur-sm rounded-2xl p-4 border-2 transition-all duration-300 hover:scale-105 ${
                      isDark 
                        ? 'bg-slate-900/50 border-slate-700' 
                        : 'bg-white/80 border-gray-200 shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-full ${
                        isDark ? 'bg-slate-800' : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${getFactorColor(factor, value)}`} />
                      </div>
                      <span className={`text-sm font-bold capitalize transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {factor === 'health' ? 'Saúde' : 
                         factor === 'sleep' ? 'Sono' :
                         factor === 'energy' ? 'Energia' :
                         factor === 'productivity' ? 'Produtividade' : 'Social'}
                      </span>
                    </div>
                    <div className={`rounded-full h-3 mb-2 transition-colors duration-300 ${
                      isDark ? 'bg-slate-800' : 'bg-gray-200'
                    }`}>
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getFactorBgColor(factor, value)}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-bold transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {Math.round(value)}%
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        value >= 70 ? 'bg-green-100 text-green-800' :
                        value >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {value >= 70 ? 'Ótimo' : value >= 40 ? 'Regular' : 'Baixo'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Informações do Tempo */}
          <div>
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Clock className="w-6 h-6 text-blue-400" />
              Tempo
            </h3>
            <div className={`backdrop-blur-sm rounded-2xl p-6 border-2 transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-900/50 border-slate-700' 
                : 'bg-white/80 border-gray-200 shadow-lg'
            }`}>
              <div className="text-center mb-4">
                <div className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatTime(gameState.day, gameState.hour, gameState.minute)}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  Desafio de 14 dias
                </div>
              </div>
              
              {/* Controles de Velocidade */}
              <div className="flex justify-center">
                <div className={`flex items-center gap-2 p-2 rounded-xl transition-colors duration-300 ${
                  isDark 
                    ? 'bg-slate-800 border border-slate-700' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Velocidade:
                  </span>
                  {[1, 2, 4].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setGameState(prev => ({ ...prev, gameSpeed: speed }))}
                      className={`px-3 py-1 rounded-lg text-sm font-bold transition-all duration-200 ${
                        gameState.gameSpeed === speed
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : isDark
                            ? 'hover:bg-slate-700 text-slate-300'
                            : 'hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Atividade Atual */}
        {gameState.currentActivity && (
          <div className={`backdrop-blur-sm rounded-2xl p-6 border-2 mb-8 transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border-emerald-500/30' 
              : 'bg-gradient-to-r from-emerald-100/80 to-emerald-200/60 border-emerald-400/50 shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  {React.createElement(activities[gameState.currentActivity as keyof typeof activities].icon, {
                    className: "w-6 h-6 text-emerald-400"
                  })}
                </div>
                <div>
                  <span className={`text-lg font-bold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {activities[gameState.currentActivity as keyof typeof activities].name}
                  </span>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    Em andamento...
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {Math.round((gameState.activityProgress / gameState.activityDuration) * 100)}%
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  {Math.round(gameState.activityDuration - gameState.activityProgress)}min restantes
                </div>
              </div>
            </div>
            <div className={`rounded-full h-4 transition-colors duration-300 ${
              isDark ? 'bg-slate-800' : 'bg-gray-200'
            }`}>
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-4 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${(gameState.activityProgress / gameState.activityDuration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Navegação de Quartos */}
        <div className="mb-8">
          <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <Home className="w-6 h-6 text-indigo-400" />
            Escolha o Local
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(rooms).map(([roomId, room]) => {
              const IconComponent = room.icon;
              return (
                <button
                  key={roomId}
                  onClick={() => changeRoom(roomId)}
                  disabled={!!gameState.currentActivity}
                  className={`p-6 rounded-2xl text-center transition-all duration-200 hover:scale-105 border-2 ${
                    gameState.currentRoom === roomId
                      ? `bg-gradient-to-br ${room.color} border-emerald-500 shadow-lg`
                      : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                        : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 shadow-lg'
                  } ${gameState.currentActivity ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <IconComponent className={`w-8 h-8 mx-auto mb-3 ${
                    gameState.currentRoom === roomId ? 'text-emerald-600' : 
                    isDark ? 'text-slate-300' : 'text-gray-600'
                  }`} />
                  <span className={`text-sm font-bold ${
                    gameState.currentRoom === roomId ? 'text-emerald-600' : ''
                  }`}>
                    {room.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Atividades do Quarto Atual */}
        <div>
          <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <Settings className="w-6 h-6 text-purple-400" />
            Atividades - {rooms[gameState.currentRoom as keyof typeof rooms].name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms[gameState.currentRoom as keyof typeof rooms].activities.map((activityId) => {
              const activity = activities[activityId as keyof typeof activities];
              const isCompleted = gameState.completedActivities.includes(activityId);
              const IconComponent = activity.icon;
              
              return (
                <button
                  key={activityId}
                  onClick={() => startActivity(activityId)}
                  disabled={!!gameState.currentActivity}
                  className={`p-6 rounded-2xl text-center transition-all duration-200 hover:scale-105 border-2 relative ${
                    gameState.currentActivity
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                        : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 shadow-lg'
                  } ${isCompleted ? 'ring-2 ring-emerald-500' : ''}`}
                >
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-slate-700' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-8 h-8 ${activity.color}`} />
                  </div>
                  
                  <div className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {activity.name}
                  </div>
                  
                  <div className={`text-sm mb-3 transition-colors duration-300 ${
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    ⏱️ {activity.duration} minutos
                  </div>
                  
                  {/* Efeitos da Atividade */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {Object.entries(activity.effects).map(([effect, value]) => (
                      <span
                        key={effect}
                        className={`text-xs px-2 py-1 rounded-full ${
                          value > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {value > 0 ? '+' : ''}{value}% {
                          effect === 'health' ? 'Saúde' : 
                          effect === 'sleep' ? 'Sono' :
                          effect === 'energy' ? 'Energia' :
                          effect === 'productivity' ? 'Produtividade' : 'Social'
                        }
                      </span>
                    ))}
                  </div>
                  
                  {isCompleted && (
                    <div className="text-xs text-emerald-500 mt-2 font-bold">
                      ✅ Concluído hoje
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DreamStoryGame;