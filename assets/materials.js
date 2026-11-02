let Material = {
  gold: {
    amb: [0.3, 0.2, 0.0],
    diff: [0.3, 0.2, 0.0],
    spec: [0.6, 0.4, 0, 20],
  },
  jade: {
    amb: [0.135, 0.2225, 0.1575],
    diff: [0.54, 0.89, 0.63],
    spec: [0.63, 0.72, 0.63, 55],
  },
  silver: {
    amb: [0.2, 0.2, 0.2],
    diff: [0.1, 0.1, 0.1],
    spec: [0.2, 0.2, 0.2, 10],
  },
  red_plastic: {
    amb: [0.2, 0.0, 0.0],
    diff: [0.6, 0.0, 0.0],
    spec: [0.1, 0.1, 0.1, 10],
  },
  blue_plastic: {
    amb: [0.0, 0.0, 0.2],
    diff: [0.0, 0.0, 0.6],
    spec: [0.1, 0.1, 0.1, 10],
  },
  black: {
    amb: [0.0, 0.0, 0.0],
    diff: [0.0, 0.0, 0.0],
    spec: [0.0, 0.0, 0.0, 10],
  },
  rand: {
    amb: [Math.random(), Math.random(), Math.random()],
    diff: [Math.random(), Math.random(), Math.random()],
    spec: [Math.random(), Math.random(), Math.random(), 10 + Math.random() * (50 - 10),
    ],
  },
};
