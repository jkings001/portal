import { useState } from 'react';
import { ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import { useLocation } from 'wouter';

/**
 * Página Presentation - Apresentação Corporativa JKINGS
 * Design profissional com imagens realistas e paleta corporativa
 */

export default function Presentation() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const services = [
    {
      title: 'Portal de Atendimento',
      description: 'Sistema completo de gestão de chamados com interface intuitiva',
      image: 'https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/jwUheqVNNPNpjSWXItndSU-img-1_1771935699000_na1fn_c2VydmljZS1wb3J0YWwtYXRlbmRpbWVudG8.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L2p3VWhlcVZOTlBOcGpTV1hJdG5kU1UtaW1nLTFfMTc3MTkzNTY5OTAwMF9uYTFmbl9jMlZ5ZG1salpTMXdiM0owWVd3dFlYUmxibVJwYldWdWRHOC5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=OLW5ojydsxdIjS~NBs-6BNW5pTffU0gobXYum2g-3GUjfnEKFzv2zyX8k8u8uMBdTE82EYO7EadkMXNCIO6Euxo-McRQ9y3Ahfbp-u2dsEVKui4TS-kGj51yTgGdlSh4MIJxKeVLmPr0lX3yJXwk-AqNSgknuD~l-veIhOwljmEnNYocryu0k55XfrwQIn11VUzipyYwi63STYbpupfsLfFV8L7x7G74uZY5Z9yNhdwk9R1YUDm9bJRmq1XN3t1e~B-okqmgRg351lIiaLK~5qii~aHkIyq4y3jUiufWZLwNzklXHR0lPRzXFoCVdQaPBhqBSoBvzh4g69ld99XhUQ__'
    },
    {
      title: 'Help Desk 24/7',
      description: 'Suporte técnico imediato com especialistas disponíveis',
      image: 'https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/jwUheqVNNPNpjSWXItndSU-img-2_1771935705000_na1fn_c2VydmljZS1oZWxwZGVzaw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L2p3VWhlcVZOTlBOcGpTV1hJdG5kU1UtaW1nLTJfMTc3MTkzNTcwNTAwMF9uYTFmbl9jMlZ5ZG1salpTMW9aV3h3WkdWemF3LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=MfdRGKpVSKhxTlZvBR96Uh02aX8MrjtGeVTcPSUT2iAjnY8E7r~lBgHOeGYXDaT7BxqwLzvZiTyDfj2sLsyCV0H2SeOZ1T6VVEQbtAZDVDUXugPcsFFcjYkJviNK1PAINurha7uDtBAacyxu9MvEBmVeH2Kopaso5W392imNacExZtEfdlH9nOUe2M3lrtUJfhzyDP~7NqDcQ9yYTRBT7N7e~zfG7g2AibV9XbKxupwoKlNVd6UarwbnjCMKqe2rvmvH-3rJqlug3rz6suHe4wCLMgAjZxyWSOsPfkPkrvD-FJvcKPu9zWeRmVDZIPXDRywZKd67xAvLD96BkoJbyQ__'
    },
    {
      title: 'Gestão de Treinamentos',
      description: 'Plataforma completa de cursos e capacitação profissional',
      image: 'https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/jwUheqVNNPNpjSWXItndSU-img-3_1771935704000_na1fn_c2VydmljZS10cmVpbmFtZW50bw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L2p3VWhlcVZOTlBOcGpTV1hJdG5kU1UtaW1nLTNfMTc3MTkzNTcwNDAwMF9uYTFmbl9jMlZ5ZG1salpTMTBjbVZwYm1GdFpXNTBidy5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=s5uBAiuqM8xE6jC~BJsRhsZI4-PJgjyph9MfGH~m-68yVm6TyAmfMKmmyS~MUbyn2pRT3zithjDimnsBh02XRBNQ7x~loP9-eBZNhmbq5qCEMyrybp7STU5RZwr4KLoJjgG8ucd4RWS-e4kw0ybI~a3lqCWg~tB~OMKZZW0ve6spYcKdtC7z6prutBynKKjQjqp4xUmFfHZH-WMVFjljaCK4G9OUqS6CSRAQDU7lXR0xi-XFCuNDj6a3ndslMWR6CWM6DKT~Ukzk-CKtU1biGrSsJ8v0TMaSTeLy3CyREmHuOrBO0B~EfDLtB-1tTMar-MWW1M5nhePWOV4KrLxhBg__'
    },
    {
      title: 'Integração Teams',
      description: 'Sincronização perfeita com Microsoft Teams',
      image: 'https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/jwUheqVNNPNpjSWXItndSU-img-4_1771935704000_na1fn_c2VydmljZS10ZWFtcw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L2p3VWhlcVZOTlBOcGpTV1hJdG5kU1UtaW1nLTRfMTc3MTkzNTcwNDAwMF9uYTFmbl9jMlZ5ZG1salpTMTBaV0Z0Y3cucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=h4lXoK4DwBRg-wIeDNoKT-YPxe9oLkgZhtdo3clNWe2H5OJVFAhaakJ7p30tTRxVOqInANxCx4CcIt~eyf8j0qf-iDtSjnHzRoPtrn7iqc7aPSw2BovyrFFJw~wGXyu5L2sGjH0Gjtl-6xHXojdDY5j-e2-FiAmo~aOUrqrUyia-S~iY6PtoB7VpfOsjn7jrqelMyEWg2-bA6deZ7R~lJbTUuM3OshtBIYKrLRmlHxlF-AppwCo0y~JKavOF2~tcqcdX6Qka8oY98fX1gIlpdeSU6Wtj4foc1ro-SF6SM~Ib9qSldBoiiqMMuzgMJPVALrcsrMqSVDZdX0zQB4LWOg__'
    },
    {
      title: 'Relatórios Avançados',
      description: 'Análise de dados e métricas em tempo real',
      image: 'https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/ZlJFaBurJwNkaUbyRmpFWe-img-1_1771937624000_na1fn_c2VydmljZS1yZWxhdG9yaW9zLWF2YW5jYWRvcw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L1psSkZhQnVySndOa2FVYnlSbXBGV2UtaW1nLTFfMTc3MTkzNzYyNDAwMF9uYTFmbl9jMlZ5ZG1salpTMXlaV3hoZEc5eWFXOXpMV0YyWVc1allXUnZjdy5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=eP9UHHVc2CWmA4417cT763-9vmqXNXznhoXcp-uVcxPfmqEsjpQlDXWeP~VeXfnrVF4kt1PK17vaNzLxXPOa-G~0LVKQIRERSSbtdp7QmHuYcubp~yFJELH93CTRmYG5OvQfhp3phBi7avElYTfEhCm5VVrFv2W0gWY46YtsTaXs3t9U-eevqcR~JI63adIDf21Tl5-kT9ouFCzUYPNCdzx2c0mH6H0RqB5xgUL19fJ67UexGm5IwhwyWpHfEmxUMPQn8qf2KA~Z8-1ePR97srdlNtYUzJV7IJIDRZbPRx3tZaYYTq2i7rrLEnROTjztAXXIC9t7SEhE8gNl--soPQ__'
    },
    {
      title: 'Gestão Multi-Empresa',
      description: 'Controle centralizado de múltiplas empresas',
      image: 'https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/7y2jKg4qnk7Nn9YWSfbcqs-img-1_1771935732000_na1fn_c2VydmljZS1lbXByZXNhcw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94Lzd5MmpLZzRxbms3Tm45WVdTZmJjcXMtaW1nLTFfMTc3MTkzNTczMjAwMF9uYTFmbl9jMlZ5ZG1salpTMWxiWEJ5WlhOaGN3LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=nwI8Qs8QehGjD0Dij2N0CacgkjkWz0XXBgfWPMUJW9vCDgpidiMoSBOkLx5xjBqP71SnxcOF1suiXcATuZGhPdeonydT04gdmWG0390dsGh3UPnreU~Xw1rx7zee07dUdbIuGO8f~F1l79TFJdy--QP1y1KF5TDStX70bIkGKT-JVjkzyVDQqSrGnwAWbDq6KM8xN3g1EpK7gQcVUOgWbLweJZCTEoB8nGmDmkO361e0SkXfjLceAWI6OnR8yjBAzMd7HUwZDol7MGYfQDed7AtO11DGxAUuAE3aXU6EetoiLu2yh~SckoudQvWXQYJurMhhYRs7EKhJnpMXlcU-jA__'
    }
  ];

  const benefits = [
    {
      title: 'Redução de Custos',
      description: 'Otimize seus gastos com TI e infraestrutura',
      image: 'https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/SR5iKRpHTIVQtRM2LFQanX-img-1_1771935760000_na1fn_ZmVhdHVyZS1jb3N0LXJlZHVjdGlvbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L1NSNWlLUnBIVElWUXRSTTJMRlFhblgtaW1nLTFfMTc3MTkzNTc2MDAwMF9uYTFmbl9abVZoZEhWeVpTMWpiM04wTFhKbFpIVmpkR2x2YmcucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=bFkwLgMS-WCdLiDygjNylhqZ0MWrL5kmmv1kkUhGllrPBry-cYsIc4IAQNeoek505H9XbrgaSRBgsqbiyqaVeo1yA-zSuOZy6Xs~JqVDwhqon3BXQRvk6T-Ol9OtXzZARGP1pWpSaqCChHgF~wWdDNqfLmdV8YCKYwd3UxBdG-8-K4lcZILL82UN0wNdWtUxDyUT1JNoWqt0gsvuDCRzcWaUVZmfNC2coXqgnX8l4Bq7XE0ZHNX5c40LdacIHlD~B7l212uu5ht24vHKsNxRRiS3~DsaiXUFM4lgIMnRQJsMly-BjNzseWf0D9LlqW6NwhhbHPW4IFPSLGaIjWuNNw__'
    },
    {
      title: 'Aumento de Produtividade',
      description: 'Sistemas operacionais sem interrupção',
      image: 'https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/SR5iKRpHTIVQtRM2LFQanX-img-2_1771935760000_na1fn_ZmVhdHVyZS1wcm9kdWN0aXZpdHk.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L1NSNWlLUnBIVElWUXRSTTJMRlFhblgtaW1nLTJfMTc3MTkzNTc2MDAwMF9uYTFmbl9abVZoZEhWeVpTMXdjbTlrZFdOMGFYWnBkSGsucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=eeTVtoiANdtMQwrdUJ77vqGNrwXH~-KC78UP1meVRk9sJKl4LhRZ3v6KXs52eNoOqzdNUvyP7fn-OO4PRFRPkwv5~Bf3hhthfYj1dDuUAbuZOZBKMzz5ls8Ix8FmIOiGwI8SzWKEEh8WwVEQm4Q0m42EYeR9LmDEXSeDGYnzXDTEU1RwXU~d3Af4hVzudGv50CJLZQqiU-~WJFJUGX19KdQNW4dVrjqrEKZLwGtGuNwBlWDqnshORbJEebRiU7VpDvtXFoepA8APXlAqwP1JaEi6GBi8Ow3joMPmqV18ZM0cHYUdONXY2lo5mNuNSI0FbrldYxAIeZmkvfPOJ7zYcQ__'
    },
    {
      title: 'Planejamento Estratégico',
      description: 'Soluções dimensionadas corretamente para seu negócio',
      image: 'https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/SR5iKRpHTIVQtRM2LFQanX-img-3_1771935761000_na1fn_ZmVhdHVyZS1zdHJhdGVneQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L1NSNWlLUnBIVElWUXRSTTJMRlFhblgtaW1nLTNfMTc3MTkzNTc2MTAwMF9uYTFmbl9abVZoZEhWeVpTMXpkSEpoZEdWbmVRLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=RZ33d7KTPGV-Vays0h0ehp-63g9~JipibUU6hjqe42LGTr6FiiFLC86kj9u87W8WMdDwvbln~ZfMvOqXz0Cgo1HylkPcr6-9fp2iZxw7b1NwW~PpISneb2LvPTIYMPaZwRyKsCdyjgsiP7fDf3j0W8bweBAoFdcxj86c5ib-hn9m0IWzonahyIohj4N0AYrcIc7lWRTRt5VtbjmEzgj1cF0vYpmeypONHiSXDI6U92YGNljFQz9HvPmTdZdiYgrv40xqxnA4q6x6fCXRJPwkt~wCqNmRcCEv0qICD~EK~f-9GNBXIiFEYliumeiCfUrWJb8gfGvfHcCJ6UYBUkac8A__'
    }
  ];

  const stats = [
    { number: '+15', label: 'Anos de Experiência' },
    { number: '+500', label: 'Empresas Atendidas' },
    { number: '95%', label: 'Chamados Resolvidos no Mesmo Dia' },
    { number: '98%', label: 'Chamados Resolvidos Remotamente' },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 3000);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('https://files.manuscdn.com/user_upload_by_module/session_file/310519663168635381/NgZcTdwWvYAtjafi.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: '#000a1f',
      }}
    >
      {/* Background Overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'linear-gradient(135deg, rgba(0,10,31,0.75) 0%, rgba(0,20,50,0.65) 50%, rgba(0,10,31,0.75) 100%)'
      }}></div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <img
                src="/images/logo-jkings-dashboard.png"
                alt="JKINGS"
                className="h-20 mx-auto mb-8"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.8))',
                }}
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
              Soluções Avançadas em Tecnologia
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Suporte técnico especializado, gestão de chamados e integração com Microsoft Teams para empresas que buscam excelência operacional
            </p>
            <button
              onClick={() => setLocation('/signup')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/60"
            >
              Solicitar Demonstração <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-16">
              Nossos Serviços
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, idx) => (
                <div
                  key={idx}
                  className="group glassmorphic rounded-2xl overflow-hidden border border-white/15 backdrop-blur-xl hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  <div className="h-48 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-cyan-300 font-bold text-lg mb-2">{service.title}</h3>
                    <p className="text-gray-200 text-sm leading-relaxed">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="glassmorphic rounded-xl p-8 text-center border border-white/15 backdrop-blur-xl"
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <p className="text-gray-200 font-medium text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-16">
              Por que escolher JKINGS?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="group glassmorphic rounded-2xl overflow-hidden border border-white/15 backdrop-blur-xl hover:border-cyan-400/50 transition-all duration-300"
                >
                  <div className="h-56 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                    <img
                      src={benefit.image}
                      alt={benefit.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-8">
                    <h3 className="text-cyan-300 font-bold text-xl mb-3">{benefit.title}</h3>
                    <p className="text-gray-200 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="glassmorphic rounded-2xl p-12 border border-white/15 backdrop-blur-xl text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Fique Atualizado
              </h2>
              <p className="text-gray-200 mb-8">
                Receba informações sobre as melhores práticas de TI e suporte técnico
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  required
                  className="flex-1 px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/60 whitespace-nowrap"
                >
                  {subscribed ? '✓ Inscrito' : 'Inscrever'}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-16">
              Entre em Contato
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glassmorphic rounded-xl p-8 border border-white/15 backdrop-blur-xl text-center">
                <Phone className="w-12 h-12 text-cyan-300 mx-auto mb-4" />
                <h3 className="text-cyan-300 font-bold text-lg mb-2">Telefone</h3>
                <p className="text-gray-200">+55 11 92156-4688</p>
              </div>
              <div className="glassmorphic rounded-xl p-8 border border-white/15 backdrop-blur-xl text-center">
                <Mail className="w-12 h-12 text-cyan-300 mx-auto mb-4" />
                <h3 className="text-cyan-300 font-bold text-lg mb-2">E-mail</h3>
                <p className="text-gray-200">contato@jkings.com.br</p>
              </div>
              <div className="glassmorphic rounded-xl p-8 border border-white/15 backdrop-blur-xl text-center">
                <MapPin className="w-12 h-12 text-cyan-300 mx-auto mb-4" />
                <h3 className="text-cyan-300 font-bold text-lg mb-2">Localização</h3>
                <p className="text-gray-200">São Paulo - SP</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/15 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <p className="text-gray-300">&copy; 2026 JKINGS Soluções em Tecnologia. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
