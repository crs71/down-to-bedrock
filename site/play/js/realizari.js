// Realizările jocului: câte un id (salvat în localStorage), un nume, ce trebuie făcut și iconița.
// icon = id-ul unui sprite; unealta = nivelul târnăcopului, desenat cu culorile lui (joc.js).
export const REALIZARI = [
  { id: 'primul', nume: 'First block', text: 'Break your first block', icon: 'bloc-pamant' },
  { id: 'lemn', nume: 'Lumberjack', text: 'Chop a log from a tree', icon: 'bloc-trunchi' },
  { id: 'prima-torta', nume: 'Let there be light', text: 'Place a torch', icon: 'torta' },
  { id: 'unealta-2', nume: 'Stone tools', text: 'Craft a stone pickaxe', unealta: 2 },
  { id: 'unealta-3', nume: 'Iron grip', text: 'Craft an iron pickaxe', unealta: 3 },
  { id: 'jumatate', nume: 'Halfway down', text: 'Reach Y 0', icon: 'bloc-piatra' },
  { id: 'mina', nume: 'Old mineshaft', text: 'Find the abandoned mineshaft', icon: 'bloc-sina' },
  { id: 'vagonet', nume: 'All aboard', text: 'Ride the minecart', icon: 'vagonet' },
  { id: 'diamante', nume: 'Diamond hunter', text: 'Mine a diamond ore', icon: 'bloc-diamant' },
  { id: 'unealta-4', nume: 'Diamond edge', text: 'Craft a diamond pickaxe', unealta: 4 },
  { id: 'nether', nume: 'Through the portal', text: 'Travel to the Nether', icon: 'portal' },
  { id: 'crema', nume: 'Squish', text: 'Pop a tiny magma cube', icon: 'crema-magma' },
  { id: 'ghast', nume: 'Ghast buster', text: 'Down a ghast with its own fireball', icon: 'lacrima-ghast' },
  { id: 'schimb', nume: 'Fair trade', text: 'Trade gold with a piglin', icon: 'lingou-aur' },
  { id: 'unealta-5', nume: 'Netherite', text: 'Craft a netherite pickaxe', unealta: 5 },
  { id: 'final', nume: 'Down to bedrock', text: 'Reach the bottom of the world', icon: 'bloc-bedrock' },
];

// Salvările din etapa 3 țineau doar mesajele deja arătate; unele dintre ele înseamnă o realizare.
export const DIN_MESAJE = {
  primul: 'primul',
  lemn: 'lemn',
  'prima-torta': 'prima-torta',
  jumatate: 'jumatate',
  mina: 'mina',
  vagonet: 'vagonet',
  'minereu-9': 'diamante',
  nether: 'nether',
  crema: 'crema',
  ghast: 'ghast',
};
