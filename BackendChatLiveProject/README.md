# ChatLive — Backend

API REST et serveur temps reel du projet **ChatLive**.
TypeScript · Express 5 · MongoDB (Mongoose) · JWT · Socket.IO.

Ce service alimente `FrontendChatLiveProject` : chaque reponse est mise en
forme selon les interfaces de `src/types/index.tsx` (`AuthUser`, `ChatUser`,
`ChatRoom`, `ChatMessage`, `Community`), et chaque message d'erreur reprend
mot pour mot celui que le front affiche. Ces interfaces sont recopiees dans
`types/index.ts` et annoncees en retour des presentateurs : une divergence
entre les deux projets devient une erreur de compilation.

Le front n'embarque plus aucun texte, aucun chiffre et aucune liste : la
navigation, les offres, l'equipe, les pays de l'inscription et les
temoignages viennent tous d'ici.

## Demarrage

```bash
npm install
# creer le .env a la racine (voir « Variables d'environnement » plus bas)
npm run seed            # jeu de donnees de demonstration (facultatif)
npm run dev             # serveur de developpement, rechargement a chaud
```

Pour une mise en ligne, compiler puis lancer le resultat :

```bash
npm run build           # tsc -> dist/
npm start               # node dist/index.js
npm run typecheck       # verification des types seule, sans emettre
```

L'API ecoute sur `http://localhost:4000` — le meme port que celui que le
front attend par defaut (`VITE_API_URL`). Verification rapide :
`GET /api/health`.

### « Le port 4000 est deja utilise »

Sous Windows, fermer le terminal ou l'editeur ne tue pas toujours le
`tsx watch` : npm meurt, mais le processus node en dessous survit et garde
le port. En developpement, le serveur surveille donc les processus qui
l'ont lance (`config/launcher.ts`) : des que l'un d'eux disparait, il se
ferme proprement et emporte le `tsx watch` reste au-dessus de lui. Plus de
restants qui s'accumulent, ni de veilleur qui reprend le port a la
prochaine sauvegarde.

Le script `predev` (`scripts/free-port.ts`) reste le filet de securite,
pour un restant anterieur ou un arret brutal : il arrete le serveur du
projet trouve sur le port, ainsi que le `tsx watch` et le `npm` orphelins
au-dessus, avant de relancer.

```bash
npm run free-port       # libere le port 4000 sans rien demarrer
```

Le script ne tue que des processus node. Si le port est tenu par un autre
programme, il le nomme et s'arrete : a vous de fermer ce programme ou de
changer `PORT` dans le `.env` — et `VITE_API_URL` cote front, pour que les
deux projets continuent de se trouver.

Le script `npm run seed` recree les 7 comptes, 4 salons, 15 messages et
9 communautes de la maquette, puis affiche les identifiants du compte de
demonstration (`demo@chatlive.io` / `chatlive2025`, role `admin`). Deux
roles y sont poses exprès, pour qu'ils soient visibles sans avoir a
toucher la base : un compte moderateur du site, et un membre nomme
moderateur d'un salon — sans etre moderateur du site, justement, puisque
les deux echelles ne se confondent pas.
Il vide les collections `users`, `rooms`, `messages` et `communities`
avant d'ecrire : ne pas le lancer sur une base de production.

## Variables d'environnement

| Cle | Role |
|---|---|
| `PORT` | port de l'API et du serveur temps reel (defaut 4000) |
| `NODE_ENV` | `development` ou `production` — **`production` en ligne** (masque les details d'erreur) |
| `TRUST_PROXY` | nombre de proxys devant l'API (Nginx, Render...) ; `0` par defaut. A regler pour que la limitation du debit voie la vraie adresse du client |
| `DB_URI` | chaine de connexion MongoDB |
| `JWT_SECRET` | secret de signature des jetons — **obligatoire**, 32 caracteres aleatoires minimum (refus de demarrer en production sinon) |
| `JWT_EXPIRES_IN` | duree de validite d'un jeton (`7d` par defaut) |
| `CLIENT_URL` | origines autorisees par le CORS, separees par des virgules |
| `GOOGLE_CLIENT_ID` | identifiant client OAuth pour « Continuer avec Google » — facultatif |
| `MAIL_HOST` / `MAIL_PORT` | serveur SMTP d'envoi (`smtp.gmail.com` / `465` par defaut) |
| `MAIL_USER` / `MAIL_PASS` | compte Gmail et **mot de passe d'application** — sans eux, aucun e-mail n'est envoye |
| `MAIL_FROM` | expediteur affiche (defaut : `ChatLive <MAIL_USER>`) |
| `VERIFICATION_TTL_MINUTES` | duree de validite d'un code de confirmation (15) |
| `VERIFICATION_RESEND_SECONDS` | delai minimal entre deux envois de code (60) |

## Securite

Branchee dans `Middlewares/security.ts` et `config/realtime.ts` :

- **En-tetes** (helmet) : CSP `default-src 'none'`, HSTS, `nosniff`, anti-iframe, pas de `X-Powered-By`.
- **Injection NoSQL / pollution de prototype** : les cles `$...`, `a.b`, `__proto__` sont retirees de tout corps de requete.
- **Limitation du debit** : 300 req/min/IP sur l'API ; connexion 20 essais/15 min par IP **et** 10 echecs/15 min par compte ; inscription et renvoi de code 10/h ; code a six chiffres 15 essais/15 min ; formulaires publics 10/h. Reponse `429` avec `code: "RATE_LIMITED"` et `retryAfter`.
- **Jetons** : algorithme `HS256` impose ; chaque compte porte un `tokenVersion` incremente au changement de mot de passe, de role, ou par `POST /api/auth/logout-all` — les jetons anterieurs sont aussitot refuses (REST et temps reel).
- **Connexion** : message unique et duree constante, que l'adresse existe ou non (pas d'enumeration des comptes). bcrypt a 12 tours.
- **Google** : rattacher Google a une inscription jamais confirmee efface le mot de passe qu'elle portait (contre le pre-detournement de compte).
- **Temps reel** : chaque evenement est valide et rattrape (un evenement malforme ne peut plus arreter le serveur), debit borne par connexion, jeton accepte seulement dans `auth` (jamais dans l'URL), connexion coupee a l'expiration du jeton, membre exclu retire aussitot du canal du salon.
- **Contenu du site** : les liens (`to`, `href`, `path`, `ctaTo`) n'acceptent que `/chemin`, `#ancre`, `http(s)://`, `mailto:`, `tel:`.
- **Corps** limites a 100 Ko, messages Socket.IO a 16 Ko, delais anti-slowloris sur le serveur HTTP.

## Structure

```
types/          contrat partage avec le front, evenements Socket.IO,
                declaration de req.user
config/         connexion Mongo, referentiel des pays, serveur Socket.IO,
                contenu editorial par defaut, mesure de disponibilite
Models/         schemas Mongoose (+ interfaces des documents)
Controllers/    logique metier
Routers/        definition des routes
Middlewares/    auth, admin, validation, gestion d'erreurs
Utils/          ApiError, asyncHandler, jetons, identifiants, presentateurs,
                mesures affichees sur le site (metrics.ts)
scripts/        peuplement de la base
dist/           sortie de `npm run build` (ignoree par git)
```

## Ce que la bascule en TypeScript garantit

| Fichier | Ce qu'il verrouille |
|---|---|
| `types/index.ts` | copie des interfaces du front (`AuthUser`, `ChatUser`, `ChatRoom`, `ChatMessage`, `MemberRole`, `Community`). Les presentateurs les annoncent en retour : un champ oublie ou renomme ne compile pas. |
| `types/socket.ts` | nom et charge utile de chaque evenement temps reel, cote emission comme cote reception. Le front peut recopier ce fichier pour typer son client. |
| `types/express.d.ts` | `req.user`. Combine a `requireUser()` (`Utils/currentUser.ts`), un routeur qui oublierait `protect` renvoie une 401 explicite au lieu de planter. |
| `Models/*.ts` | chaque schema Mongoose expose l'interface de son document (`UserDocument`, `RoomDocument`...), d'ou un `room.members[i].lastReadAt` verifie a la compilation. |

La premiere section de `types/index.ts` reste la copie exacte du contrat
cote navigateur ; ce que le serveur seul connait (statuts de moderation,
enveloppes HTTP, charges utiles du contenu editorial) est declare plus bas.
`role` et `provider` y ont change de camp le jour ou le front s'est mis a
les lire : ils appartiennent maintenant au contrat commun.

## Authentification

Les routes protegees attendent l'en-tete :

```
Authorization: Bearer <token>
```

Le jeton est renvoye par `/api/auth/verify`, `/api/auth/login` et
`/api/auth/google` — **pas** par `/api/auth/register`, qui laisse le compte
en attente de confirmation.

### Les trois roles

Un seul fichier decrit la hierarchie, `Utils/roles.ts` : un droit s'exprime
en « au moins ce role », jamais en comparant des chaines. L'intergiciel
`requireRole(minimum)` (`Middlewares/adminMiddleware.ts`) en derive `isAdmin`
et `isModerator`, si bien qu'un administrateur passe partout ou un
moderateur passe, sans qu'aucune route ait a citer les deux.

| Role | Ce qu'il ouvre |
|---|---|
| `user` (defaut) | son compte, ses salons, ses messages |
| `moderator` | ce qui se renouvelle chaque jour : communautes, temoignages, messages de contact. Ni les comptes, ni les roles, ni le contenu editorial |
| `admin` | tout, y compris l'identite du site, le contenu des pages et les roles des comptes |

Le front lit ce role sur `AuthUser` et s'en sert pour afficher ou masquer
l'entree *Administration* et chaque onglet de la page correspondante
(`src/lib/roles.tsx`). Ce n'est qu'un confort : **c'est le serveur qui
refuse**, a chaque ecriture. Forcer l'adresse `/administration` donne une
page qui n'enregistre rien.

> Pour designer le premier administrateur, passer son champ `role` a
> `"admin"` directement en base. Ensuite, `PUT /api/users/:id/role` suffit —
> et la page `/administration` le fait sans quitter le navigateur. Le compte
> cree par `npm run seed` est deja administrateur.
>
> Deux refus protegent cette route : on ne se retire pas son propre role, et
> on ne retrograde pas le dernier administrateur du site.

## Endpoints

Legende : 🔓 public · 🔒 membre connecte · 🛡️ moderateur (ou plus) · 👑 administrateur

### Authentification — `/api/auth`
| Methode | Route | Acces |
|---|---|---|
| POST | `/register` | 🔓 |
| POST | `/verify` | 🔓 |
| POST | `/verify/resend` | 🔓 |
| POST | `/login` | 🔓 |
| POST | `/google` | 🔓 |
| GET | `/me` | 🔒 |
| POST | `/logout` | 🔒 |

`/register` attend `name`, `email`, `password` (8 caracteres minimum) et,
facultativement, `country` (un nom de la liste des 24 pays). Le serveur en
deduit `initials`, `flag` et `language` : le front n'a rien a calculer.

### Confirmation de l'adresse e-mail

`/register` ne connecte plus : il cree un compte `emailVerified: false` et
envoie un code a six chiffres a l'adresse saisie. Le compte existe, mais il
n'ouvre rien tant que le code n'a pas ete saisi — `/login` repond alors 403
avec `code: "EMAIL_NOT_VERIFIED"`, ce qui indique au front d'afficher
l'ecran de saisie plutot qu'une erreur.

```json
{
  "message": "Compte cree. Confirmez votre adresse e-mail.",
  "pendingVerification": true,
  "email": "camille@exemple.fr",
  "delivered": true,
  "codeLength": 6,
  "expiresInMinutes": 15,
  "resendInSeconds": 60
}
```

`/verify` attend `email` et `code` (les espaces et tirets recopies depuis
l'e-mail sont ignores) et renvoie une session complete : l'utilisateur est
connecte sans ressaisir son mot de passe. `/verify/resend` emet un nouveau
code, le precedent cessant aussitot de fonctionner.

Trois limites encadrent un code aussi court, toutes reglees dans
`Utils/verification.ts` : expiration (`VERIFICATION_TTL_MINUTES`), cinq
essais, et un delai entre deux envois (`VERIFICATION_RESEND_SECONDS`). Le
code n'est jamais conserve en clair — la base n'en garde qu'une empreinte
bcrypt, l'e-mail en est la seule copie.

Cas particuliers :

- **inscription abandonnee** : une seconde inscription sur une adresse
  jamais confirmee reprend le compte en attente au lieu de repondre
  « adresse deja prise » — un formulaire abandonne ne condamne pas
  l'adresse ;
- **Google** : aucun code, Google a deja verifie l'adresse. Un compte en
  attente rattache a Google devient confirme du meme coup ;
- **comptes anterieurs** a cette fonctionnalite : ils n'ont pas le champ et
  restent acceptes, la verification ne refusant que `emailVerified === false`.

Sans `MAIL_USER` / `MAIL_PASS` dans le `.env`, rien n'est envoye : le code
s'affiche dans la console du serveur et `delivered` vaut `false`. C'est de
quoi developper sans SMTP. Pour de vrais envois, Gmail demande la
validation en deux etapes puis un **mot de passe d'application**
(<https://myaccount.google.com/apppasswords>) — le mot de passe du compte
Google lui-meme est refuse par le SMTP.

`/google` attend le `credential` rendu par le bouton « Continuer avec
Google » du front, et facultativement `country`. Le serveur verifie la
signature du jeton aupres de Google, controle qu'il a bien ete emis pour
notre `GOOGLE_CLIENT_ID`, puis :

- `googleId` deja connu -> connexion ;
- adresse deja inscrite au mot de passe -> le compte Google y est
  rattache (Google a verifie cette adresse, c'est la meme personne) ;
- inconnu -> creation du compte, sans mot de passe.

La reponse est celle de `/login`, augmentee de `created` : vrai quand ce
clic vient de creer le compte. Un compte Google pur n'ayant pas
d'empreinte, `/login` et `PUT /api/users/password` le renvoient vers le
bouton Google plutot que de repondre « mot de passe incorrect ».

Sans `GOOGLE_CLIENT_ID` dans le `.env`, la route repond 503 avec un
message explicite : le reste de l'API n'est pas affecte.

Reponse de `/register` et `/login` :

```json
{
  "message": "Connexion reussie",
  "token": "<jwt>",
  "user": {
    "id": "6a9e...", "name": "Aya Ben Salah", "email": "aya@chatlive.io",
    "initials": "AS", "country": "Tunisie", "flag": "TN",
    "language": "Arabe", "createdAt": "2026-09-07T17:05:36.849Z",
    "role": "user", "provider": "local"
  }
}
```

### Utilisateurs — `/api/users`
| Methode | Route | Acces |
|---|---|---|
| GET | `/countries` (referentiel des 24 pays) | 🔓 |
| GET / PUT | `/profile` | 🔒 |
| PUT | `/password` | 🔒 |
| PUT | `/presence` | 🔒 |
| GET | `/search?search=...` (annuaire, sans e-mail) | 🔒 |
| GET | `/all` | 👑 |
| GET / DELETE | `/:id` | 👑 |
| PUT | `/:id/role` | 👑 |

Changer de pays via `PUT /profile` recalcule `flag` et `language` ;
changer de nom recalcule `initials`.

### Salons — `/api/rooms` (🔒 partout)
| Methode | Route | Detail |
|---|---|---|
| GET | `/` | les salons du membre, tries par activite, avec `unread` |
| GET | `/discover?search=&community=` | salons publics non encore rejoints |
| POST | `/` | creer un salon (le createur en est proprietaire) |
| GET / PUT / DELETE | `/:id` | PUT : moderation du salon · DELETE : proprietaire |
| GET | `/:id/members` | membres au format `ChatUser`, chacun avec son `roomRole` |
| POST | `/:id/members` | inviter (moderation du salon) |
| PUT | `/:id/members/:userId/role` | nommer, retrograder, transmettre (proprietaire) |
| DELETE | `/:id/members/:userId` | exclure (moderation du salon) |
| POST | `/:id/join` · DELETE `/:id/leave` | rejoindre / quitter |
| POST | `/:id/read` | remet `unread` a zero |
| GET | `/:roomId/messages?limit=50&before=<ISO>` | fil du salon |
| POST | `/:roomId/messages` | envoyer un message (500 caracteres max) |

`unread` est calcule par lecteur, a partir de la date de son dernier
passage dans le salon ; ses propres messages n'y comptent jamais.

`community=<id>` restreint `discover` aux salons d'une communaute : c'est
ce que le bouton *Rejoindre* du repertoire envoie, pour ouvrir les salons
de la communaute cliquee plutot que la liste entiere.

#### Roles a l'interieur d'un salon

Une seconde echelle, sans rapport avec le role de site : `owner`,
`moderator`, `member`, et elle ne vaut que dans ce salon. Le proprietaire
distribue les roles (un moderateur tient le salon, il ne se choisit pas de
successeur) ; `role: "owner"` transmet le salon et retrograde l'ancien
proprietaire en moderateur, pour qu'un salon garde toujours exactement un
proprietaire. Un administrateur du site passe outre : c'est le seul recours
quand un proprietaire disparait.

### Messages — `/api/messages` (🔒)
| Methode | Route | Acces |
|---|---|---|
| PUT | `/:id` | auteur |
| DELETE | `/:id` | auteur, moderation du salon, ou administrateur |

Un message sort au format `ChatMessage` : `minutesAgo` est recalcule a
chaque lecture, et `translatedFrom` n'apparait que si l'auteur ecrivait
dans une autre langue que celle du lecteur.

### Communautes — `/api/communities`
| Methode | Route | Acces |
|---|---|---|
| GET | `/` (filtres : `topic`, `search`, `featured`) | 🔓 |
| GET | `/topics` | 🔓 |
| GET | `/:id` | 🔓 |
| POST / PUT / DELETE | `/` · `/:id` | 🛡️ |

`topic=Tous` est accepte et ne filtre rien : c'est la valeur par defaut du
filtre cote front.

L'audience renvoyee (`members`, `online`) n'est pas stockee : elle est comptee
sur les salons rattaches a la communaute et sur la presence reelle de leurs
membres. Ces deux champs ne sont donc pas modifiables, meme par un
administrateur.

### Contact — `/api/contact`
| Methode | Route | Acces |
|---|---|---|
| GET | `/subjects` (liste acceptee par la validation) | 🔓 |
| POST | `/` | 🔓 (rattache au compte si connecte) |
| GET | `/` (filtre : `status`) · `/:id` | 🛡️ |
| PUT | `/:id/status` | 🛡️ |
| DELETE | `/:id` | 🛡️ |

### Contenu du site — `/api/site`
| Methode | Route | Acces |
|---|---|---|
| GET | `/` (identite, navigation, pied de page, fonctionnalites, offres, FAQ, equipe, jalons, bureaux, temoignages, pays, sujets de contact, chiffres) | 🔓 |
| GET | `/content/:section` | 🔓 |
| GET | `/content` (toutes les entrees, depubliees comprises, charge utile non aplatie) | 👑 |
| PUT | `/` (identite du site) | 👑 |
| POST / PUT / DELETE | `/content/:section` · `/content/:section/:key` | 👑 |
| PUT | `/content/:section/reorder` (corps : `{ keys: [...] }`) | 👑 |

C'est la source unique des pages vitrines : le front n'embarque plus aucun
texte. Les rubriques acceptees sont listees dans `Models/siteContent.ts`, et
`config/defaultContent.ts` ne sert qu'a remplir ce qui manque au demarrage —
une fois en base, c'est la base qui fait foi.

La page `/administration` du front se branche sur ces routes, onglet par
onglet et selon le role : *Temoignages* et *Communautes* sont ouverts aux
moderateurs, *Identite*, *Contenu des pages* et *Comptes et roles* restent
aux administrateurs. Chaque onglet correspond exactement aux droits que la
route verifie de son cote.

### Chiffres — `/api/stats` 🔓

Tout ce que le site affiche comme nombre est mesure ici, a chaque appel :
comptes inscrits, pays et langues representes, messages (total, 30 jours,
aujourd'hui), salons, communautes, membres en ligne, note moyenne des
temoignages, disponibilite et temps de reponse. Les entrees de contenu des
rubriques `stat` et `metric` ne portent qu'un libelle et le nom de la mesure.

### Temoignages — `/api/testimonials`
| Methode | Route | Acces |
|---|---|---|
| GET | `/` (publies) | 🔓 |
| GET | `/mine` · POST `/` | 🔒 |
| GET | `/all` · PUT `/:id/status` · DELETE `/:id` | 🛡️ |

Un temoignage appartient a un compte reel : le nom, le pays et la pastille
affiches sont lus sur ce compte. Un membre en a un seul, et il n'apparait sur
le site qu'une fois relu.

### Apercu public — `/api/showcase` 🔓

Salon vitrine, ses derniers messages, les membres en ligne et les pays d'ou ils
se connectent : de quoi peindre l'accueil et les pages de connexion avec des
donnees reelles. **Seuls les salons dont `showcase` vaut `true` peuvent y
figurer** — une conversation ordinaire, publique ou non, ne sort jamais de ses
membres.

### Lettre mensuelle — `/api/newsletter`
| Methode | Route | Acces |
|---|---|---|
| POST | `/` | 🔓 (rattachee au compte si connecte) |
| DELETE | `/:email` | 🔓 |
| GET | `/` | 👑 |

### Sante — `/api/health` 🔓

Renvoie l'etat de la base, la disponibilite mesuree sur 30 jours et le temps de
reponse median. La disponibilite n'est pas declaree : chaque demarrage ouvre une
periode dans `ServiceRun` et la prolonge d'un battement par minute (voir
`config/uptime.ts`), si bien qu'un arret laisse un trou que le calcul voit.

## Temps reel (Socket.IO)

Le serveur Socket.IO ecoute sur le meme port que l'API et exige le meme
jeton. Les deux tableaux ci-dessous sont la transcription de
`types/socket.ts`, que le front peut recopier tel quel :

```ts
import { io } from 'socket.io-client'
const socket = io(import.meta.env.VITE_API_URL, { auth: { token } })
```

| Emis par le client | Charge utile |
|---|---|
| `room:join` / `room:leave` | `roomId` |
| `message:send` | `{ roomId, body }` (accuse de reception facultatif) |
| `message:read` | `roomId` |
| `typing:start` / `typing:stop` | `roomId` |
| `presence:set` | `"online" \| "away" \| "offline"` |

| Recu par le client | Charge utile |
|---|---|
| `message:new` | `{ roomId, message: ChatMessage }` |
| `message:updated` · `message:deleted` | `{ roomId, message }` · `{ roomId, id }` |
| `typing` | `{ roomId, user: ChatUser, typing: boolean }` |
| `presence:update` | `{ userId, presence }` |
| `room:updated` · `room:deleted` | `ChatRoom` · `{ id }` |
| `room:member-joined` · `room:member-left` | `{ roomId, member }` · `{ roomId, userId }` |

Un message poste en REST est diffuse aux sockets, et inversement : les deux
voies restent coherentes. Le temps reel est un confort, pas une
dependance — toutes les fonctionnalites existent aussi en REST.

## Format des erreurs

Toutes les erreurs sortent par le meme handler :

```json
{
  "success": false,
  "message": "Un compte existe deja avec cette adresse e-mail.",
  "field": "email"
}
```

`field` designe le champ de formulaire fautif : c'est ce qui permet au
front d'afficher le message sous le bon input, comme le faisait sa classe
`AuthError`. `stack` est ajoute hors production.

Codes utilises : 400 (validation), 401 (jeton absent, invalide ou
identifiants refuses), 403 (droits insuffisants, adresse non confirmee),
404, 409 (doublon), 413 (corps trop volumineux), 500.

Certaines erreurs portent en plus un champ `code`, quand le front doit
faire autre chose qu'afficher le message : `EMAIL_NOT_VERIFIED`,
`ALREADY_VERIFIED`, `CODE_EXPIRED`, `TOO_SOON`.

## Ou le front appelle quoi

Le branchement est fait : le front ne simule plus rien, il n'a plus une
seule donnee en dur. Un seul fichier connait l'adresse du serveur et la
forme des reponses, `src/lib/api.tsx` ; les composants n'y voient que des
fonctions typees avec les interfaces de `src/types/index.tsx` — celles-la
memes que `types/index.ts` recopie ici.

| Cote front | Cote serveur |
|---|---|
| `authApi` (`src/lib/api.tsx`), relaye par `src/lib/auth-storage.tsx` | `/api/auth/*` |
| `SiteProvider` au demarrage | `GET /api/site` (+ `/api/stats`, `/api/showcase`) |
| `useChat` (`src/hooks/useChat.tsx`) | `/api/rooms/*` en REST, Socket.IO pour ce qui arrive des autres |
| `useRoomDirectory` | `GET /api/rooms/discover` |
| Page `/administration` | `/api/site`, `/api/testimonials`, `/api/communities`, `/api/users` |
| `src/types/socket.tsx` | recopie de `types/socket.ts` |

Ce qui reste au navigateur tient en peu de choses : le jeton, le profil mis
en cache, le theme et le consentement aux cookies. Tout le reste — textes,
chiffres, pays, temoignages, droits — vient d'ici.

Deux consequences a garder en tete en modifiant ce serveur :

- **un champ ajoute a une interface du front doit l'etre dans
  `types/index.ts`.** C'est la que la synchronisation se verifie : le
  presentateur concerne cesse alors de compiler tant qu'il ne le renvoie
  pas ;
- **ce que le front masque, le serveur doit le refuser.** Cacher un bouton
  selon le role est un confort d'interface ; la seule protection est
  `requireRole` sur la route.
