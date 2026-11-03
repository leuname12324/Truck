export type Livery = {
  id: string;
  name: string;
  number: string;
  body: string;
  cab: string;
  stripe: string;
  accent: string;
  wing: string;
  rim: string;
};

export const LIVERIES: Livery[] = [
  {
    id: "player",
    name: "Bandeira",
    number: "07",
    body: "#e8eef6",      // prata / branco gelo
    cab: "#e8eef6",
    stripe: "#1a1a1a",    // listra preta
    accent: "#ffd700",    // dourado/amarelo
    wing: "#1a1a1a",      // asa preta
    rim: "#d8d4c8",
  },
  {
    id: "ai1",
    name: "Paulista",
    number: "11",
    body: "#d8d4c8",      // prata
    cab: "#d8d4c8",
    stripe: "#b42318",    // listra vermelha
    accent: "#ffd700",
    wing: "#1a1a1a",
    rim: "#c9c4b8",
  },
  {
    id: "ai2",
    name: "Atlântica",
    number: "22",
    body: "#1d4e89",      // azul corsa
    cab: "#1d4e89",
    stripe: "#f4f6f1",    // listra branca
    accent: "#ffd700",
    wing: "#101418",
    rim: "#c9c4b8",
  },
  {
    id: "ai3",
    name: "Sol",
    number: "44",
    body: "#e8eef6",      // branco
    cab: "#e8eef6",
    stripe: "#c45c12",    // listra laranja
    accent: "#ffd700",
    wing: "#1a1a1a",
    rim: "#c9c4b8",
  },
  {
    id: "ai4",
    name: "Noite",
    number: "88",
    body: "#1a1d1a",      // preto carbono
    cab: "#1a1d1a",
    stripe: "#ffd700",    // listra dourada
    accent: "#e8eee4",
    wing: "#0c0d0c",
    rim: "#8a8a84",
  },
];
