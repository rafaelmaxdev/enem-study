import type {Subject} from './domain';
import apostas2026 from './edcley-2026.json';
import telegram2026 from './edcley-telegram-2026.json';
import revisoes2026 from './edcley-revisoes-2026.json';

export const edcleyChannel='https://t.me/edcleymateriais';

type Question = {
 number:number;
 page:number;
 subject:Subject;
 prompt:string;
 options:string[];
 answer:number;
 explanation:string;
 image?:string;
 imageOptions?:boolean;
 explanationImage?:string;
 sourceNumber?:number;
 adapted?:boolean;
};
type Exam = {id:string; title:string; questions:Question[]};

export const edcleyExams:Exam[]=[
 ...([...apostas2026,...telegram2026,...revisoes2026] as Exam[]).sort((a,b)=>a.id.localeCompare(b.id,'pt-BR',{numeric:true})),
 {
  id:'capes-2025-parte-1',
  title:'Prêmio Capes 2025 · Parte 1 · Matemática e Natureza',
  questions:[
   {
    number:2,page:3,subject:'Química',
    prompt:'No processo Solvay, a proporção entre a amônia e o carbonato de sódio produzido é de 2 mol para 1 mol. Partindo de 20 mol de amônia, com rendimento de 90%, qual massa de carbonato de sódio (106 g/mol) é produzida?',
    options:['477 g','954 g','1.060 g','1.200 g','848 g'],answer:1,
    explanation:'A proporção 2:1 dá 10 mol de produto no caso ideal. Com 90% de rendimento, são 9 mol. A massa é 9 × 106 = 954 g.',
   },
   {
    number:4,page:4,subject:'Matemática',
    prompt:'Cinco funcionários, em ordem fixa, escolhem ao acaso uma chave cada, sem reposição. Apenas uma das cinco chaves liga o carro. Qual a probabilidade de o terceiro funcionário escolher a chave certa?',
    options:['1/5','1/4','1/3','2/5','1/2'],answer:0,
    explanation:'A chave certa tem a mesma probabilidade de ocupar cada uma das cinco posições. Também dá para calcular a chance de os dois primeiros errarem e o terceiro acertar: (4/5) × (3/4) × (1/3) = 1/5.',
   },
   {
    number:6,page:5,subject:'Matemática',
    prompt:'Um funcionário ganha R$ 440 trabalhando 40 horas normais e 10 horas extras. Cada hora extra paga 50% a mais que a normal. Quantas horas extras adicionais são necessárias para aumentar seu pagamento em R$ 792?',
    options:['55 horas','60 horas','66 horas','70 horas','80 horas'],answer:2,
    explanation:'Se a hora normal vale x, então 40x + 10 × 1,5x = 440. Logo, x = 8 e a hora extra vale R$ 12. São necessárias 792 ÷ 12 = 66 horas extras adicionais.',
   },
   {
    number:8,page:6,subject:'Matemática',
    prompt:'Três funcionários produzem 720 tijolos em seis horas. Mantendo a mesma produtividade individual, quantos tijolos cinco funcionários produzem em nove horas?',
    options:['1.080','1.200','1.350','1.440','1.800'],answer:4,
    explanation:'A equipe inicial trabalhou 3 × 6 = 18 horas de trabalho individual, produzindo 40 tijolos por funcionário a cada hora. A nova equipe acumula 5 × 9 = 45 horas, o que dá 45 × 40 = 1.800 tijolos.',
   },
   {
    number:9,page:7,subject:'Matemática',
    prompt:'Se o comprimento do lado de um triângulo equilátero muda, de que forma sua área depende desse comprimento?',
    options:['Diretamente proporcional ao lado','Diretamente proporcional ao quadrado do lado','Diretamente proporcional ao cubo do lado','Inversamente proporcional ao lado','Inversamente proporcional ao quadrado do lado'],answer:1,
    explanation:'Para um lado L, a altura é L√3/2. A área, base vezes altura dividida por dois, vale L²√3/4. Se o lado dobrar, por exemplo, a área quadruplica.',
   },
   {
    number:12,page:9,subject:'Biologia',
    prompt:'Em uma área urbanizada, chuvas intensas agravam enchentes. Qual alteração ambiental aumenta diretamente o volume de água que escoa pela superfície?',
    options:['Eutrofização de corpos d’água','Impermeabilização dos solos','Redução da camada de ozônio','Aumento da taxa de fotossíntese','Acidificação dos oceanos'],answer:1,
    explanation:'Asfalto, concreto e outras superfícies impermeáveis reduzem a infiltração da chuva. Assim, mais água escoa rapidamente para áreas baixas, galerias e rios, o que favorece alagamentos.',
   },
   {
    number:13,page:9,subject:'Química',
    prompt:'Na comparação entre biodiesel e diesel convencional, qual característica do biodiesel ajuda a reduzir a formação de chuva ácida?',
    options:['Maior eficiência energética em qualquer motor','Ausência de gases de efeito estufa na queima','Origem renovável por si só','Teor de enxofre muito menor','Melhor desempenho do motor por si só'],answer:3,
    explanation:'A queima de combustíveis com enxofre emite óxidos como SO₂, que podem formar ácidos na atmosfera. O teor de enxofre muito baixo do biodiesel reduz essas emissões.',
   },
   {
    number:15,page:10,subject:'Química',
    prompt:'O gelo seco é dióxido de carbono sólido. Na passagem direta do CO₂ sólido para o gasoso, qual interação entre suas moléculas é vencida?',
    options:['Ligação covalente','Ligação iônica','Forças de dispersão de London','Ligação metálica','Ligação de hidrogênio'],answer:2,
    explanation:'A molécula linear de CO₂ é apolar. Suas moléculas se atraem por dipolos instantâneos e induzidos, as forças de London. Na sublimação, as moléculas se afastam e as ligações C=O permanecem intactas.',
   },
   {
    number:19,page:12,subject:'Biologia',
    prompt:'Na esquistossomose, caramujos de água doce participam do ciclo do parasita. Qual medida de saúde pública ajuda a interromper a transmissão?',
    options:['Vacinar contra o verme','Gradear os leitos dos rios','Distribuir antivirais','Ampliar o saneamento e o acesso à água segura','Promover contato controlado com a água contaminada'],answer:3,
    explanation:'Coletar e tratar o esgoto reduz a chegada de ovos do parasita à água doce. O acesso à água segura também diminui o contato da pele com as larvas liberadas pelos caramujos.',
   },
  ],
 },
 {
  id:'capes-2025-parte-4',
  title:'Prêmio Capes 2025 · Parte 4 · Matemática e Natureza',
  questions:[
   {
    number:2,page:3,subject:'Biologia',
    prompt:'Durante a metáfase, os cromossomos de uma célula ficaram dispersos e não formaram a placa metafásica. Qual estrutura atua diretamente no alinhamento e explica melhor essa falha?',
    options:['Centríolos','Nucléolo','Membrana plasmática','Fibras do fuso mitótico','Retículo endoplasmático'],answer:3,
    explanation:'Microtúbulos do fuso se ligam aos cinetócoros dos cromossomos. As forças exercidas a partir de polos opostos posicionam os cromossomos no centro da célula e permitem sua posterior separação.',
   },
   {
    number:3,page:4,subject:'Biologia',
    prompt:'No fenótipo de Bombaim, um indivíduo não produz a substância H necessária à formação dos antígenos A e B. Assim, pode parecer do tipo O mesmo que tenha alelos para produzir A ou B. Que interação genética explica esse efeito?',
    options:['Codominância','Epistasia recessiva','Herança poligênica','Dominância incompleta','Ligação gênica'],answer:1,
    explanation:'O genótipo recessivo hh impede a formação da substância H. Como os antígenos A e B dependem desse precursor, o genótipo em outro gene mascara a expressão do sistema ABO.',
   },
   {
    number:4,page:4,subject:'Biologia',
    prompt:'O cruzamento seletivo de cães por várias gerações acentua traços desejados. Em algumas raças, ele também aumenta a incidência de doenças hereditárias. Qual é a principal explicação?',
    options:['Maior chance de expressão de alelos recessivos deletérios','Perda de plasticidade fenotípica como causa direta de toda doença genética','Surgimento obrigatório de mutações dominantes','Exposição a mais patógenos externos','Estresse ambiental que altera diretamente o genoma'],answer:0,
    explanation:'Quando a reprodução fica restrita a poucos indivíduos aparentados, cresce a chance de um filhote herdar duas cópias do mesmo alelo recessivo deletério. A condição pode se manifestar mesmo que os pais, portadores de apenas uma cópia, sejam saudáveis.',
   },
   {
    number:5,page:5,subject:'Física',
    prompt:'Um trem de brinquedo de 0,2 kg percorre uma semicircunferência de raio 0,5 m com velocidade escalar constante de 1 m/s. Qual o módulo da variação de sua quantidade de movimento entre o início e o fim da curva?',
    options:['0 kg·m/s','0,1 kg·m/s','0,25 kg·m/s','0,4 kg·m/s','1,25 kg·m/s'],answer:3,
    explanation:'O momento tem módulo mv = 0,2 kg·m/s nos dois pontos. Ao completar meia volta, a velocidade tangencial aponta no sentido oposto. Subtrair os vetores opostos dá uma variação de módulo 2 × 0,2 = 0,4 kg·m/s.',
   },
   {
    number:7,page:6,subject:'Biologia',
    prompt:'Uma questão compara a associação dos corais com algas simbiontes à organização de abelhas numa colmeia. Qual alternativa distingue as duas interações?',
    options:['Ambas ocorrem exclusivamente entre espécies diferentes','A associação coral–alga envolve espécies diferentes, enquanto a cooperação na colmeia ocorre entre abelhas da mesma espécie','Ambas ocorrem exclusivamente entre indivíduos da mesma espécie','Ambas são explicadas apenas por fatores abióticos','Ambas representam competição por alimento'],answer:1,
    explanation:'Coral e alga pertencem a espécies diferentes e podem estabelecer mutualismo. A divisão do trabalho numa colmeia caracteriza uma sociedade, uma relação de cooperação entre indivíduos da mesma espécie.',
   },
   {
    number:8,page:6,subject:'Química',
    prompt:'Os potenciais padrão de redução de Li, K, Ba, Mg, Al e Ni são, respectivamente, −3,05 V, −2,93 V, −2,90 V, −2,30 V, −1,66 V e −0,25 V. Qual par maximiza a diferença de potencial de uma pilha?',
    options:['Lítio e níquel','Potássio e magnésio','Bário e alumínio','Lítio e potássio','Magnésio e níquel'],answer:0,
    explanation:'A redução ocorre no cátodo, escolhido pelo maior potencial de redução. A oxidação ocorre no ânodo, escolhido pelo menor. Com níquel e lítio, a diferença vale −0,25 − (−3,05) = 2,80 V.',
   },
   {
    number:11,page:8,subject:'Matemática',
    prompt:'Dois cilindros retos têm a mesma área lateral. O primeiro tem volume igual a 4/9 do volume do segundo. Qual é a razão entre o raio do primeiro e o do segundo?',
    options:['2/3','3/5','4/9','1/2','5/9'],answer:2,
    explanation:'A área lateral 2πrh é igual nos dois casos, então rh é constante. O volume πr²h pode ser escrito como πr(rh). Com rh fixo, a razão dos volumes é igual à razão dos raios: 4/9.',
   },
   {
    number:15,page:10,subject:'Matemática',
    prompt:'Uma prateleira deve receber exatamente três pacotes de café. Há três tipos disponíveis, A, B e C, e pelo menos um pacote deve ser do tipo A. Desconsiderando a ordem, quantas composições são possíveis?',
    options:['6','8','9','10','12'],answer:0,
    explanation:'Reserve um pacote A. Para os dois restantes, as possibilidades sem considerar a ordem são AA, AB, AC, BB, BC e CC. Cada uma gera uma composição distinta, totalizando seis.',
   },
   {
    number:16,page:11,subject:'Biologia',
    prompt:'Uma cadeia alimentar aquática tem fitoplâncton, zooplâncton, peixes pequenos e peixes predadores. Considerando a biomagnificação do mercúrio, qual é a ordem esperada da menor para a maior concentração?',
    options:['Fitoplâncton → zooplâncton → peixes pequenos → predadores','Fitoplâncton → peixes pequenos → zooplâncton → predadores','Zooplâncton → fitoplâncton → peixes pequenos → predadores','Peixes pequenos → fitoplâncton → zooplâncton → predadores','Fitoplâncton → zooplâncton → predadores → peixes pequenos'],answer:0,
    explanation:'Predadores ingerem o mercúrio acumulado nas presas. Como o contaminante persiste nos tecidos, sua concentração tende a aumentar a cada nível trófico, com o maior valor nos grandes predadores.',
   },
  ],
 },
];
