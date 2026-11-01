import type { NewsArticle } from '../types.js'

export const categories = [
  'Brasil',
  'Mundo',
  'Política',
  'Economia',
  'Tecnologia',
  'Esportes',
  'Entretenimento',
] as const

export const newsSeed: NewsArticle[] = [
  {
    id: 1,
    titulo: 'A nova fase da energia renovável no Brasil ganha velocidade',
    slug: 'nova-fase-energia-renovavel-brasil',
    resumo:
      'Investimentos públicos e privados impulsionam parques solares e eólicas em regiões estratégicas do país.',
    conteudo:
      'A expansão do setor segue com crescimento acelerado, levando novas tecnologias e oportunidades de emprego para estados com ampla capacidade de produção renovável.',
    categoria: 'Brasil',
    autor: 'Ana Souza',
    fonte: 'Portal de Notícias',
    urlFonte: 'https://example.com/noticias/energia-brasil',
    imagemId: 'img-brasil-1',
    imagemUrl:
      'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80',
    destaque: true,
    status: 'publicado',
    dataPublicacao: '2026-10-31T08:30:00.000Z',
    dataCriacao: '2026-10-31T08:30:00.000Z',
    dataAtualizacao: '2026-10-31T08:30:00.000Z',
    versao: 1,
  },
  {
    id: 2,
    titulo: 'Setores de IA avançam com foco em eficiência e governança',
    slug: 'setores-ia-avancam-com-foco-eficiencia-governanca',
    resumo:
      'Empresas buscam modelos mais econômicos e com regras claras de uso para reduzir riscos e aumentar produtividade.',
    conteudo:
      'A adoção de sistemas inteligentes permanece em alta, especialmente em áreas de atendimento, dados e automação operacional.',
    categoria: 'Tecnologia',
    autor: 'Mauro Prado',
    fonte: 'Tecnologia Hoje',
    urlFonte: 'https://example.com/noticias/ia-eficiencia',
    imagemId: 'img-tec-1',
    imagemUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    destaque: false,
    status: 'publicado',
    dataPublicacao: '2026-10-30T12:00:00.000Z',
    dataCriacao: '2026-10-30T12:00:00.000Z',
    dataAtualizacao: '2026-10-30T12:00:00.000Z',
    versao: 1,
  },
  {
    id: 3,
    titulo: 'Mercado financeiro se ajusta diante de juros e inflação',
    slug: 'mercado-financeiro-se-ajusta-diante-de-juros-e-inflacao',
    resumo:
      'Analistas apontam leitura cautelosa do cenário doméstico enquanto investidores revisam expectativas para 2027.',
    conteudo:
      'A combinação de juros, inflação e consumo influencia decisões corporativas e os movimentos de mercado em diferentes segmentos.',
    categoria: 'Economia',
    autor: 'Priscila Lemos',
    fonte: 'Mercado em Foco',
    urlFonte: 'https://example.com/noticias/mercado-financeiro',
    imagemId: 'img-economia-1',
    imagemUrl:
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
    destaque: false,
    status: 'publicado',
    dataPublicacao: '2026-10-29T09:15:00.000Z',
    dataCriacao: '2026-10-29T09:15:00.000Z',
    dataAtualizacao: '2026-10-29T09:15:00.000Z',
    versao: 1,
  },
  {
    id: 4,
    titulo: 'Seleção promove campanha com foco em juventude e técnica',
    slug: 'selecao-promove-campanha-com-foco-em-juventude-e-tecnica',
    resumo:
      'Treinadores reforçam preparação para o próximo ciclo competitivo com novas apostas no elenco.',
    conteudo:
      'A estratégia da equipe combina experiência e jovens talentos em busca de melhores resultados em competições nacionais.',
    categoria: 'Esportes',
    autor: 'Rafael Costa',
    fonte: 'Arena Esporte',
    urlFonte: 'https://example.com/noticias/selecao-juventude',
    imagemId: 'img-esportes-1',
    imagemUrl:
      'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
    destaque: false,
    status: 'publicado',
    dataPublicacao: '2026-10-28T18:45:00.000Z',
    dataCriacao: '2026-10-28T18:45:00.000Z',
    dataAtualizacao: '2026-10-28T18:45:00.000Z',
    versao: 1,
  },
]
