Contexte du projet:

Stage : développement d'un CRM commercial (gestion de force de vente) pour une petite entreprise (cosmétiques/shampoing), basé sur un cahier des charges. Le CEO sera l'admin. Projet solo, ~1 mois, déjà en cours d'utilisation réelle prévue par l'entreprise.

Stack technique (décidé et justifié)
Frontend : React + Vite + Tailwind CSS (palette monochrome noir/blanc/gris)
Backend : Node.js + Express
Base de données : PostgreSQL, hébergée sur Supabase
ORM : Prisma
Auth : JWT (jsonwebtoken) + bcryptjs, tokens valables 8h
Déploiement prévu : Vercel (frontend), Render (backend), Supabase (DB) — gratuit au départ, ~7$/mois recommandé pour éviter le sleep du backend
Décisions de conception clés
Pas d'auto-inscription : seul l'admin crée les comptes commerciaux (via /register verrouillé par requireRole("ADMIN"))
Un seul modèle User avec champ role (ADMIN/COMMERCIAL), pas deux tables séparées
Isolation des données : chaque commercial ne voit que ses propres clients/visites/commandes ; l'admin voit tout
Soft delete partout : jamais de suppression réelle, on utilise des statuts (INACTIVE, isActive)
Totaux de commande toujours recalculés côté serveur, jamais fait confiance au frontend
Calcul à la volée plutôt que stockage : les KPI, ratios d'objectifs, statuts dérivés sont recalculés à chaque lecture plutôt que stockés (évite la désynchronisation)
Schéma Prisma actuel (modèles)
User : id, name, email, password, role, isActive, region
Client : id, name, phone, status (PROSPECT/ACTIVE/INACTIVE/TO_FOLLOW_UP), location, type, commercialId
Visit : id, clientId, commercialId, date, result, comment, orderPlaced, nextActionDate
Order : id, clientId, commercialId, date, total, status (PENDING/CONFIRMED/DELIVERED/CANCELLED)
OrderItem : id, orderId, product, quantity, price
Objective (mis à jour récemment) : commercialId, period, targetRevenue, targetVisitsPerDay, minOrdersPerDay
Task (nouveau) : commercialId, clientId, timesPerMonth — pour les tâches type "visiter ce client X fois/mois"
Objectifs business communiqués par le CEO (dernière étape)
15 contacts (visites)/jour par commercial
350 000 DA de CA/mois par commercial
Minimum 4 commandes/jour par commercial
Certains clients "à forte rotation" doivent être visités un nombre de fois précis par mois (via Task)
Backend — routes construites
auth.routes.js : register (admin only), login
clients.routes.js : CRUD complet, filtré par rôle, admin peut assigner un client à un commercial spécifique à la création
visits.routes.js : CRUD + mise à jour automatique du statut client (Commande signée → ACTIVE, Relance nécessaire → TO_FOLLOW_UP)
orders.routes.js : CRUD, total toujours recalculé serveur
objectives.routes.js : CRUD + route /progress qui calcule tout à la volée (contacts du jour, commandes du jour, CA du mois, tâches)
tasks.routes.js (nouveau) : création/suppression de tâches par client
users.routes.js : liste des commerciaux (admin), édition, activation/désactivation, historique combiné visites+commandes par commercial

Middleware requireAuth vérifie aussi isActive en base (pas seulement le JWT) pour que la désactivation soit immédiate.

Frontend — pages construites
Login.jsx, App.jsx (routing + ProtectedRoute par rôle)
Layout.jsx : sidebar + header partagés, liens différents selon rôle
Côté commercial : CommercialDashboard.jsx (KPI + progression objectifs + tâches), Clients.jsx (liste + recherche + filtres statut/localisation), ClientDetail.jsx (fiche client avec tabs Visites/Commandes, édition, ajout), Visits.jsx, Orders.jsx (avec modal détail commande)
Côté admin : AdminClients.jsx (tous les clients, filtre par commercial, export CSV, assignation), Commerciaux.jsx (liste, activer/désactiver, éditer), CommercialDetail.jsx (historique chronologique combiné visites+commandes d'un commercial, filtrable par date)
Modals réutilisables : ClientFormModal, VisitFormModal, OrderFormModal, OrderDetailModal, CommercialFormModal — tous suivent le même pattern (create/edit selon présence d'un objet existing..., props onClose/onCreated/onUpdated)
