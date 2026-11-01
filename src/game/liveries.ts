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
    body: "#1f8a3c",
    cab: "#1f8a3c",
    stripe: "#e8c547",
    accent: "#1c3d8a",
    wing: "#0e0f0e",
    rim: "#d8d4c8",
  },
  {
    id: "ai1",
    name: "Paulista",
    number: "11",
    body: "#b42318",
    cab: "#b42318",
    stripe: "#f4f6f1",
    accent: "#1a1a1a",
    wing: "#1a1a1a",
    rim: "#c9c4b8",
  },
  {
    id: "ai2",
    name: "Atlântica",
    number: "22",
    body: "#1d4e89",
    cab: "#1d4e89",
    stripe: "#e8eef6",
    accent: "#c23b2e",
    wing: "#101418",
    rim: "#c9c4b8",
  },
  {
    id: "ai3",
    name: "Sol",
    number: "44",
    body: "#c45c12",
    cab: "#c45c12",
    stripe: "#1a1a1a",
    accent: "#f0efe8",
    wing: "#1a1a1a",
    rim: "#c9c4b8",
  },
  {
    id: "ai4",
    name: "Noite",
    number: "88",
    body: "#1a1d1a",
    cab: "#1a1d1a",
    stripe: "#2f9e4a",
    accent: "#e8eee4",
    wing: "#0c0d0c",
    rim: "#8a8a84",
  },
];
