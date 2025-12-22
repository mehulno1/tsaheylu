export type Club = {
    id: string;
    name: string;
    status: 'Active' | 'Expiring';
    announcements: string[];
  };
  
  export const CLUBS: Club[] = [
    {
      id: '1',
      name: 'Shri Jain Shwetambar Sangh',
      status: 'Active',
      announcements: [
        '🙏 Annual Paryushan Mahaparva begins from 7th September.',
        '🗳️ Committee elections will be held on 15th October.',
      ],
    },
    {
      id: '2',
      name: 'Gujarati Samaj Kolkata',
      status: 'Expiring',
      announcements: [
        '🎭 Navratri Garba night on 3rd October.',
        '📢 Membership renewal closes on 30th September.',
      ],
    },
    {
      id: '3',
      name: 'Atma Tatva Research Centre',
      status: 'Active',
      announcements: [
        '📘 New research sessions announced for October.',
      ],
    },
  ];
  