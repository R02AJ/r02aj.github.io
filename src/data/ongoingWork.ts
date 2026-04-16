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
      'A structure-preserving Hamiltonian framework for joint spot, rate-curve, and option-surface dynamics, with built-in no-arbitrage, symplectic numerics, and uncertainty propagation.',
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
      'A continuous variational framework for local, noise-aware calibration of arbitrage-free option surfaces, coupling the price sheet with a Hamiltonian fog density over (m, tau, u).',
    source: {
      type: 'pdf',
      reference: '/files/Summary_chebyshev.pdf'
    }
  },
  {
    title: 'Symmetry, Rigidity & Mixed-Boundary Geometric PDE',
    category: 'Geometric analysis',
    status: 'Ongoing',
    description:
      'A platform-problem-driven research direction centered on symmetry and rigidity in mixed-boundary elliptic PDE, with sub-spherical-sector symmetry as the current target and quantitative symplectic geometry as a longer-run bridge.',
    source: {
      type: 'prompt',
      reference:
        'Immediate target: mixed-boundary geometric PDE with sub-spherical-sector symmetry extension (or counterexample), then symmetry/rigidity and maximum-principle program with analysis-meets-symplectic bridge.'
    }
  }
];
