export const currentUser = {
  name: "Alex Rivera",
  avatar: "https://i.pravatar.cc/100",
}
export const mockTracks = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop',
    duration: 203,
    votes: 42,
    addedBy: currentUser,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },

  {
    id: '2',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    albumArt: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Dua_Lipa_%E2%80%93_Dua_Lipa_cover_art.png',
    duration: 203,
    votes: 35,
    addedBy: {
      name: "Bob Smith",
      avatar: "https://i.pravatar.cc/101",
    },
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: '3',
    title: 'Peaches',
    artist: 'Justin Bieber',
    album: 'Justice',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b2736c20c4638a558132ba95bc39',
    duration: 198,
    votes: 28,
    addedBy: {
      name: "Jade Lee",
      avatar: "https://i.pravatar.cc/102",
    },
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
]
export const liveRooms = [
  {
    id: '1',
    name: 'Friday Night Vibes',
    description: 'The best tracks to kick off your weekend',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    isPublic: true,
    isLive: true,
    participantCount: 47,
    host: "Bob Smith",
    currentTrack: mockTracks[0],
    genres: ['Pop'],
    createdAt: '2024-01-15',
  },
  {
    id: "2",
    name: "The Global Lounge",
    host: "Tom Taylor",
    participantCount: "1.2k",
    isLive: true,
    genres: ["Techno", "House", "EDM"],
    currentTrack: mockTracks[1],
    coverImage:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063",
  },
  {
    id: "4",
    name: "Techno Basement",
    participantCount: "850",
    host: "Jade Lee",
    currentTrack: mockTracks[2],
    genres: ["Rock"],
    coverImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAO_jglrdNIZ_Vp0cY_8lKfMDAQgWjDAiwzvoTwc3_SOVvrxDBb0AVD3yMaogfbMxEB_Wiv2fXey7lV-TEz035akHBjOB5i8srhiSpjVr226Eadgl3VyJU-9apbquTkiFTtx8bjXMj4ZkAmi8mfEldKxQQXSDhcEJ4lvv7jvAKENWs538OQhthe_yy-_iPCxxKyMIJ7mIkcFVnGNWAGiQti_Bo263LtQkY_kGy44p3CY_fYeXLcTrC8ZHNKhZKgLVem6Hk6z3vXmjc",
  },

  {
    id: "3",
    name: "Chillhop Cafe",
    participantCount: "430",
    host: "Tom Taylor",
    currentTrack: mockTracks[0],
    genres: ["Lo-fi", "Chillhop"],
    coverImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDEzghgtVTEw6GJF4Apgo4WRpWTW1Ild6HJYWtxYgCC7fkBgrkgru-1ajtcVil2BGKQSzeZKFjlrWGUZ5Pp5Vb6T3bi6g5r1Dh2ev0NUPu55DKF8ilWuQ8RVDWusA3ObJFHzeJR64enOqSowvG93JMMvBkIV8uOBwHU-KBHadAsKpXeH4kvPom8KhjKq88Bw-u91BpZzsONmv4N1vCFgD0Qu4d-MQ7KetniC1DZPRS4uKkWW47WtNyiNClkwCBB0SldkJJs89qpzak",
  },
];

export const liveRoom = [
  {
    id: "1",
    title: "The Global Lounge",
    listeners: "1.2k",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAO_jglrdNIZ_Vp0cY_8lKfMDAQgWjDAiwzvoTwc3_SOVvrxDBb0AVD3yMaogfbMxEB_Wiv2fXey7lV-TEz035akHBjOB5i8srhiSpjVr226Eadgl3VyJU-9apbquTkiFTtx8bjXMj4ZkAmi8mfEldKxQQXSDhcEJ4lvv7jvAKENWs538OQhthe_yy-_iPCxxKyMIJ7mIkcFVnGNWAGiQti_Bo263LtQkY_kGy44p3CY_fYeXLcTrC8ZHNKhZKgLVem6Hk6z3vXmjc",
  },
  {
    id: "2",
    title: "Techno Basement",
    listeners: "850",
    image:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063",
  },
];
export const recentRooms = [
  {
    id: "1",
    title: "Midnight Jazz Sessions",
    time: "Ended 2h ago",
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
  },
  {
    id: "2",
    title: "Lo-fi Study Beats",
    time: "Ended Yesterday",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
  },
  {
    id: "3",
    title: "Hip Hop Classics",
    time: "Ended 3 days ago",
    image:
      "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2",
  },
];


export const rooms = [
  {
    id: "1",
    title: "Chill Lounge",
    host: "Tom Taylor",
    listeners: 23,
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
    isLive: true,
  },
  {
    id: "2",
    title: "House Party",
    host: "Alex Rivera",
    listeners: 12,
    image:
      "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2",
    isLive: true,
  },
];