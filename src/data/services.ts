// Servicios de gusi.dev. Las tarifas cerradas son las MISMAS que publica
// alamia.es (el estudio de Gusi, donde se contratan y pagan): si cambian allí,
// cambiarlas aquí. gusi.dev añade los proyectos a medida (con presupuesto).
export const ALAMIA_URL = 'https://alamia.es/';

export interface Service {
  title: string;
  description: string;
  /** Precio mostrado tal cual ('250 €') o 'A medida'. */
  price: string;
  /** Aclaración del precio: 'pago único', 'al mes'… */
  priceNote: string;
  /** Dónde se contrata: alamia.es para las tarifas cerradas, el formulario para lo demás. */
  href: string;
}

export const services: Service[] = [
  {
    title: 'Desarrollo web',
    description:
      'Tu presencia online lista para captar clientes: diseño adaptado al móvil, SEO básico y entrega en 7–10 días.',
    price: '250 €',
    priceNote: 'pago único',
    href: ALAMIA_URL,
  },
  {
    title: 'Optimización de velocidad',
    description:
      'Auditoría de Core Web Vitals, optimización de carga e informe con las métricas de antes y después.',
    price: '190 €',
    priceNote: 'pago único',
    href: ALAMIA_URL,
  },
  {
    title: 'Backend y APIs',
    description:
      'La base técnica para crecer con seguridad: API REST documentada, base de datos y panel de administración.',
    price: '400 €',
    priceNote: 'pago único',
    href: ALAMIA_URL,
  },
  {
    title: 'Mantenimiento web',
    description:
      'Actualizaciones de seguridad, copias automáticas, monitorización 24/7 y 1 h de cambios al mes.',
    price: '10 €',
    priceNote: 'al mes',
    href: ALAMIA_URL,
  },
  {
    title: 'Proyectos a medida',
    description:
      'Aplicaciones web, integraciones con IA, migraciones complejas desde WordPress y soluciones en Cloudflare Workers.',
    price: 'A medida',
    priceNote: 'presupuesto sin compromiso',
    href: '#contacto',
  },
];
