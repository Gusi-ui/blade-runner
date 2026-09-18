// Efemérides tecnológicas por década: respaldo de la calculadora cuando Wikipedia
// no devuelve eventos de ciencia para el día de nacimiento.

export interface TechNewsEvent {
  title: string;
  description: string;
  source: string;
  url?: string;
}

const DECADES: { start: number; events: [string, string][] }[] = [
  {
    start: 1950,
    events: [
      [
        'Revolución del transistor',
        'El transistor revoluciona la electrónica, reemplazando las válvulas de vacío y permitiendo dispositivos más pequeños y eficientes.',
      ],
      [
        'Era temprana de la computación',
        'Las primeras computadoras comerciales comienzan a utilizarse en empresas e instituciones.',
      ],
      [
        'Inicio de la carrera espacial',
        'La Unión Soviética y Estados Unidos inician la competencia por la conquista del espacio.',
      ],
    ],
  },
  {
    start: 1960,
    events: [
      [
        'Programa Apollo',
        'La NASA desarrolla el programa Apollo con el objetivo de llevar humanos a la Luna.',
      ],
      [
        'Circuitos integrados',
        'Los circuitos integrados permiten crear dispositivos electrónicos más complejos y compactos.',
      ],
      [
        'Precursor de ARPANET',
        'Se sientan las bases de lo que eventualmente se convertiría en Internet.',
      ],
    ],
  },
  {
    start: 1970,
    events: [
      [
        'Invención del microprocesador',
        'Intel lanza el primer microprocesador comercial, revolucionando la informática.',
      ],
      [
        'Llegan las computadoras personales',
        'Las primeras computadoras personales llegan al mercado, haciendo la tecnología más accesible.',
      ],
      [
        'Misiones Voyager',
        'La NASA lanza las sondas Voyager para explorar el sistema solar exterior.',
      ],
    ],
  },
  {
    start: 1980,
    events: [
      [
        'Revolución del IBM PC',
        'El IBM PC establece el estándar para las computadoras personales compatibles.',
      ],
      [
        'Protocolos de Internet',
        'Se establecen los protocolos TCP/IP que formarían la base de Internet moderna.',
      ],
      [
        'Programa del transbordador espacial',
        'La NASA opera transbordadores reutilizables, revolucionando el acceso al espacio.',
      ],
    ],
  },
  {
    start: 1990,
    events: [
      [
        'World Wide Web',
        'Tim Berners-Lee crea la World Wide Web, transformando Internet en una red global accesible.',
      ],
      [
        'Revolución digital',
        'La tecnología digital reemplaza los sistemas analógicos en comunicaciones y multimedia.',
      ],
      [
        'Telescopio espacial Hubble',
        'La NASA lanza el Hubble, que ofrece imágenes sin precedentes del universo.',
      ],
    ],
  },
  {
    start: 2000,
    events: [
      [
        'Era de los smartphones',
        'Los teléfonos inteligentes transforman la comunicación y el acceso a la información.',
      ],
      [
        'Auge de las redes sociales',
        'Las plataformas sociales cambian la forma en que las personas se conectan y comunican.',
      ],
      [
        'Rovers en Marte',
        'La NASA envía rovers a Marte para explorar el planeta rojo y buscar signos de vida.',
      ],
    ],
  },
  {
    start: 2010,
    events: [
      [
        'Computación en la nube',
        'Los servicios en la nube transforman cómo almacenamos datos y ejecutamos aplicaciones.',
      ],
      [
        'Avances en inteligencia artificial',
        'El aprendizaje profundo y las redes neuronales logran avances significativos.',
      ],
      [
        'Cohetes reutilizables',
        'SpaceX logra aterrizar y reutilizar cohetes, reduciendo el coste de acceso al espacio.',
      ],
    ],
  },
  {
    start: 2020,
    events: [
      [
        'La tecnología ante la COVID-19',
        'La pandemia acelera la adopción del trabajo remoto y de las tecnologías de comunicación.',
      ],
      [
        'Telescopio espacial James Webb',
        'La NASA lanza el telescopio más potente jamás construido para observar el universo.',
      ],
      [
        'Modelos de lenguaje con IA',
        'Los modelos de lenguaje de inteligencia artificial alcanzan capacidades sin precedentes.',
      ],
    ],
  },
];

const GENERIC: [string, string][] = [
  [
    'Evolución tecnológica',
    'Durante esta época, la tecnología continuó evolucionando con importantes desarrollos.',
  ],
  [
    'Descubrimientos científicos',
    'Se realizaron descubrimientos científicos significativos en diversas áreas.',
  ],
  ['Exploración espacial', 'La exploración del espacio avanzó con nuevas misiones y tecnologías.'],
];

export const techEventsFor = (birthYear: number): TechNewsEvent[] => {
  const decade = DECADES.find(d => birthYear >= d.start && birthYear < d.start + 10);
  return (decade?.events ?? GENERIC).map(([title, description]) => ({
    title: `${birthYear}s: ${title}`,
    description,
    source: 'Historia tecnológica',
  }));
};
