# ENEM Study

Site de estudos de Matemática, Física, Química e Biologia, com jornada de conteúdos, videoaulas, questões e resoluções salvas.

**Acesso:** https://rafaelmaxdev.github.io/enem-study/

## Uso

- Cada pessoa começa com progresso vazio. Respostas, revisões e ponto de parada ficam salvos no navegador do próprio dispositivo.
- Use Preferências e backup para exportar e restaurar seu progresso. Limpar os dados do navegador pode apagar o histórico e PDFs importados. Não há sincronização automática entre dispositivos.
- Simulados SAS: 19 cadernos de 2020, 2021 e 2022, com prova e resolução original. O banco de prática contém outros itens revisados.
- A biblioteca permite guardar PDFs e revisar questões manualmente, com gabarito e explicação conferidos.
- As explicações e dicas já estão salvas. Não há tutor de IA ou cadastro.

## Desenvolvimento

Node.js 22 ou superior. Execute `npm ci`, `npm test` e `npm run build:pages`. O resultado está em dist-pages.

Em Settings → Pages, a origem de publicação deve ser GitHub Actions. O fluxo publica automaticamente após envios à branch main. As páginas usam endereços com # para que atualizar e compartilhar links funcione sem servidor.

O repositório não contém histórico pessoal, chave de API ou configurações privadas. Materiais de terceiros preservam seus créditos e referências e não recebem nova licença por estarem incluídos. Projeto independente, sem vínculo com o Inep ou o SAS.
