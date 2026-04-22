export type OngoingWorkItem = {
  title: string;
  category: string;
  status: 'Ongoing';
  description: string;
  source: {
    type: 'pdf' | 'prompt';
    reference: string;
  };
};

export const ongoingWorkItems: OngoingWorkItem[] = [
  {
    title: 'Financial Hamiltonian Theory & Computational Aspects',
    category: 'Quantitative finance',
    status: 'Ongoing',
    description:
      'A Hamiltonian state space for spot, rates, volatility factors, and option sheets, with symplectic time stepping and no-arbitrage checks built in.',
    source: {
      type: 'pdf',
      reference: '/files/Arbitrage_Free_Option_Price_Surfaces.pdf'
    }
  },
  {
    title: 'Hamiltonian Fog Calibration of Arbitrage-Free Option Surfaces',
    category: 'Quantitative finance',
    status: 'Ongoing',
    description:
      'A local post-fit for quote regions the global surface cannot reconcile: a price sheet coupled to a fog density over (m, τ, u).',
    source: {
      type: 'pdf',
      reference: '/files/Summary_chebyshev.pdf'
    }
  },
  {
    title: 'Self-Minkowski billiard rigidity',
    category: 'Geometric analysis',
    status: 'Ongoing',
    description:
      'A geometric-analysis project on whether total integrability of the self-Minkowski billiard in K = {N ≤ 1} forces the norm N to be Euclidean, equivalently K to be a centered ellipse after a linear change of coordinates.',
    source: {
      type: 'prompt',
      reference: 'Reversible Hopf/Pestov positivity gap and non-reversible odd-cocycle rigidity gap.'
    }
  }
];
