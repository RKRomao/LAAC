SET NAMES utf8mb4;
INSERT INTO posts (user_id, organization_id, content, image_url, video_url, created_at) VALUES 
(1, 1, 'Hackathon do Nucleo de Informatica a começar! 💻🚀', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800', NULL, NOW() - INTERVAL 2 HOUR),
(2, 2, 'Ensaio geral para a atuação de amanhã. A Desertuna não para! 🎶🍷', 'https://images.unsplash.com/photo-1514525253361-b83f859b73c0?auto=format&fit=crop&q=80&w=800', NULL, NOW() - INTERVAL 5 HOUR),
(1, 3, 'A Praxe UBI dá as boas-vindas aos novos caloiros! 🛡️🏰', NULL, 'https://www.w3schools.com/html/mov_bbb.mp4', NOW() - INTERVAL 1 DAY),
(1, NULL, 'Alguém para ir jantar à cantina do Polo IV? 🍔', NULL, NULL, NOW() - INTERVAL 3 HOUR),
(2, 1, 'Workshop de Python no Bloco 6 amanhã às 14h. Não faltem! 🐍', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=800', NULL, NOW() - INTERVAL 8 HOUR),
(1, 2, 'Mais um troféu para a nossa galeria! Parabéns Desertuna! 🏆', 'https://images.unsplash.com/photo-1523580494863-6f30312248fd?auto=format&fit=crop&q=80&w=800', NULL, NOW() - INTERVAL 2 DAY),
(2, NULL, 'As vistas da Covilhã hoje estão incríveis. Que privilégio estudar aqui! 🏔️✨', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800', NULL, NOW() - INTERVAL 10 HOUR),
(1, NULL, 'Dica: A biblioteca tem novos lugares com tomadas no piso 2! 🔋📖', NULL, NULL, NOW() - INTERVAL 12 HOUR);
