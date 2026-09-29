# ChatLive — Frontend

Plateforme de **chat en direct entre amis, partout dans le monde**.
Frontend entierement ecrit en **TypeScript** (React 19 + Vite 8 + React Router 7).

Palette officielle : **orange · blanc · noir**.

---

## Demarrage

```bash
npm install            # dependances
cp .env.example .env   # adresse du backend (VITE_API_URL)
npm run dev            # serveur de developpement (http://localhost:5173)
npm run build          # verification de types + build de production
npm run preview        # previsualisation du build
npm run lint           # ESLint
```

Le front parle au `BackendChatLiveProject` : lancer aussi l'API
(`npm run dev` dans ce dossier) avant d'ouvrir la messagerie. Deux
variables, dont une facultative :

| Cle | Role |
|---|---|
| `VITE_API_URL` | adresse de l'API **et** du serveur Socket.IO (defaut `http://localhost:3000`) |
| `VITE_GOOGLE_CLIENT_ID` | identifiant client OAuth du bouton « Continuer avec Google ». Meme valeur que le `GOOGLE_CLIENT_ID` du serveur. Absent, les deux boutons Google restent affiches mais inactifs, et les formulaires par e-mail fonctionnent normalement. |

Les pages publiques (accueil, tarifs, communautes...) restent consultables
serveur eteint : seules la messagerie et l'authentification en dependent.

---

## Ce que contient le projet

### Navigation complete (navbar + footer)

La navbar est fixe, translucide, se densifie au defilement et expose les
**7 entrees du menu**, chacune avec sa page dediee :

| Menu             | Route              | Composant             | Fond anime |
| ---------------- | ------------------ | --------------------- | ---------- |
| Accueil          | `/`                | `HomePage`            | `aurora`   |
| Fonctionnalites  | `/fonctionnalites` | `FeaturesPage`        | `mesh`     |
| Messagerie       | `/messagerie`      | `ChatPage`            | `orbits`   |
| Communautes      | `/communautes`     | `CommunitiesPage`     | `waves`    |
| Tarifs           | `/tarifs`          | `PricingPage`         | `rays`     |
| A propos         | `/a-propos`        | `AboutPage`           | `grid`     |
| Contact          | `/contact`         | `ContactPage`         | `bubbles`  |
| (Connexion)      | `/connexion`       | `LoginPage`           | `rays`     |
| (Inscription)    | `/inscription`     | `RegisterPage`        | `waves`    |
| (Confirmation)   | `/confirmation`    | `VerifyEmailPage`     | `pulse`    |
| (Administration) | `/administration`  | `AdminPage`           | `grid`     |
| (404)            | `*`                | `NotFoundPage`        | `pulse`    |

Elle comporte aussi : bascule de theme sombre/clair, un **tiroir mobile** anime
(fermeture au clavier, verrouillage du defilement, apparition en cascade des
entrees) et, selon la session, soit les boutons *Se connecter* / *Rejoindre*,
soit le **menu du compte** (avatar, nom, e-mail, acces messagerie, deconnexion,
et l entree *Administration* pour les comptes qui en ont le role).

Le footer regroupe la marque, un formulaire de lettre d information, les reseaux
sociaux, **4 colonnes de liens** (Produit, Entreprise, Ressources, Legal) et un
bandeau de statut des services.

### Fonds d ecran animes avec overlay complet

Chaque page possede sa propre variante de fond, plein ecran et animee. Les
strates communes et `aurora` (le fond de l accueil) sont dans
`src/styles/backgrounds.css` ; les sept autres variantes ont chacune leur
fichier dans `src/styles/backgrounds/`, importe par les pages qui l affichent :

`aurora` · `mesh` · `orbits` · `waves` · `rays` · `grid` · `bubbles` · `pulse`

Toutes appliquent le meme **overlay complet en 4 strates** :

1. teinte de marque (deux halos orange en degrade radial) ;
2. scrim noir vertical qui garantit le contraste du texte ;
3. vignette peripherique ;
4. grain anime + fines scanlines.

### Authentification et acces a la messagerie

Le parcours complet **inscription -> confirmation par e-mail -> connexion ->
deconnexion** est en place, avec une **demande de connexion** devant la
messagerie.

| Element                          | Fichier                                 |
| -------------------------------- | --------------------------------------- |
| Etat de session partage          | `src/context/AuthProvider.tsx`          |
| Contexte (separe du composant)   | `src/context/auth-context.ts`           |
| Accesseur                        | `src/hooks/useAuth.ts`                  |
| Magasin de comptes / session     | `src/lib/auth-storage.ts`               |
| Protection de route              | `src/components/auth/RequireAuth.tsx`   |
| Demande de connexion             | `src/components/auth/AuthPrompt.tsx`    |
| Bouton « Continuer avec Google » | `src/components/auth/GoogleAuthButton.tsx` |
| Chargement de la bibliotheque Google | `src/hooks/useGoogleIdentity.ts` |
| Pages                            | `src/pages/LoginPage.tsx` · `RegisterPage.tsx` · `VerifyEmailPage.tsx` |

Comment cela se comporte :

- **`/messagerie` est protegee.** Un visiteur non connecte n est pas redirige :
  il reste sur `/messagerie` et voit la **demande de connexion** (« Connectez-vous
  pour discuter avec vos amis »), avec le nombre de salons, d amis en ligne, et
  les deux boutons *Se connecter* / *Creer un compte*.
- **Retour automatique.** L adresse demandee voyage dans l etat de navigation
  (`state.from`) : une fois connecte, le membre revient exactement la ou il
  voulait aller.
- **Inscription** : nom, e-mail, pays (qui fixe la langue de traduction par
  defaut), mot de passe avec **jauge de robustesse**, confirmation et acceptation
  des conditions. Chaque champ est valide et annonce son erreur (`aria-invalid`,
  `aria-describedby`). Elle ne connecte pas : elle mene a `/confirmation`.
- **Confirmation de l adresse** : six cases pour le code recu par e-mail, avec
  avance automatique, retour arriere, fleches, collage du code entier (espaces
  et tirets compris) et validation des le sixieme chiffre. Le bouton
  *Renvoyer le code* est grise pendant le delai annonce par le serveur. C est
  cette page qui ouvre la session ; l adresse en cours survit a un
  rechargement (`chatlive-pending-email` dans le magasin local).
- **Connexion d un compte non confirme** : le serveur repond
  `EMAIL_NOT_VERIFIED`, et la page renvoie vers `/confirmation` plutot que
  d afficher un refus sans issue.
- **Connexion** : e-mail + mot de passe, affichage/masquage du mot de passe,
  messages d erreur rattaches au bon champ (« aucun compte », « mot de passe
  incorrect »).
- **Deconnexion** depuis le menu du compte, le tiroir mobile ou l en-tete de la
  messagerie ; la session est effacee immediatement.
- **Le compte connecte devient l identite du chat** : nom, initiales, pastille de
  pays et langue apparaissent dans le fil, dans la liste des membres et sur les
  messages envoyes.

Les comptes vivent desormais sur le serveur. `src/lib/auth-storage.ts` ne
garde plus dans le navigateur que le jeton et le profil mis en cache ; le
mot de passe part vers l API, qui le stocke hache avec bcrypt. Comme
annonce, seules les fonctions publiques de ce fichier ont change de corps :
aucun composant, aucune garde de route n a bouge.

Au demarrage, le profil en cache s affiche immediatement (pas de
clignotement), puis `GET /api/auth/me` tranche : jeton expire ou compte
supprime ramenent l interface a l etat anonyme. Un 401 recu en cours de
navigation produit le meme effet, en un seul endroit
(`AuthProvider` ecoute l evenement emis par le client HTTP).

### Logo

Logo vectoriel maison (`src/components/ui/Logo.tsx`) : bulle de conversation en
degrade orange contenant un globe en rotation, avec pastille pulsante. Decline en
favicon SVG (`public/favicon.svg`).

---

## Arborescence

```
src/
├─ components/
│  ├─ auth/       RequireAuth, AuthPrompt, AuthAside
│  ├─ home/       Hero, ChatPreview, StatsBand, FeatureGrid, Steps,
│  │              Testimonials, CtaBand
│  ├─ layout/     Navbar, Footer, Layout, Page, ScrollToTop
│  └─ ui/         Logo, Icon, AnimatedBackground, Reveal, PageHero, PageLoader
├─ context/       AuthProvider + auth-context (session partagee)
├─ data/          site.ts (editorial), chat.ts (illustrations), auth.ts (pays)
├─ context/       AuthProvider (session), SiteProvider (contenu du site)
├─ hooks/         useInView, useCountUp, useTheme, useSeo (metadonnees),
│                 useAuth, useSite (contenu et chiffres), useChat (messagerie)
├─ lib/           api.ts (client HTTP), socket.ts (Socket.IO),
│                 auth-storage.ts (jeton et session), format.ts (chiffres),
│                 seo.ts (metadonnees de toutes les adresses), site-url.ts
├─ pages/         les 11 pages du routeur (dont AdminPage)
├─ styles/        tokens, base, backgrounds, layout, pages, boot (squelette),
│                 admin (charge par AdminPage seule)
│  ├─ pages/      une feuille par page, chargee avec elle
│  └─ backgrounds/ un fichier par fond, sauf `aurora` (accueil) reste commun
├─ types/         index.ts (contrat de donnees), socket.ts (evenements)
├─ App.tsx        routeur
├─ AppTree.tsx    l arbre complet, hors react-dom (paquet a part)
├─ main.tsx       point d entree : reclame les deux paquets et monte
└─ vite-env.d.ts  typage de import.meta.env

public/
├─ fonts/         Inter et Sora, servies par le site (voir « Performance »)
├─ favicon.svg    le logo, vectoriel
├─ og-image.png   la carte partagee sur les reseaux (1200 x 630)
├─ apple-touch-icon.png, icon-512.png   icones d application
└─ site.webmanifest

scripts/
└─ brand-images.mjs  regenere les trois images ci-dessus (voir « Referencement »)
```

**Le front ne contient aucune donnee.** Il n y a plus de dossier `src/data/` :
textes, navigation, offres, questions frequentes, equipe, bureaux, temoignages
et referentiel des pays sont lus sur l API au demarrage (`GET /api/site`), et
les chiffres affiches — membres, pays, messages, disponibilite, latence — sont
mesures par le serveur a chaque appel (`GET /api/stats`), puis rafraichis toutes
les minutes. Modifier un texte ou un tarif se fait donc en base, par les routes
d administration, sans redeployer.

`SiteProvider` attend cette reponse avant le premier rendu — la barre de
navigation elle-meme en depend — et affiche un ecran explicite si le serveur ne
repond pas : aucun contenu de secours n est embarque, puisqu il risquerait de ne
plus etre vrai.

Cette attente ne laisse plus l ecran vide : `index.html` porte un squelette
statique du haut de l accueil, qui s affiche des l arrivee du document et que
React remplace quand il a de quoi peindre (voir « Performance »).

---

## Administration du contenu — `/administration`

Le contenu vivant en base, il faut un endroit pour le modifier : c est cette
page, reservee aux comptes dont le role vaut `admin`. Quatre onglets :

| Onglet | Ce qu il modifie |
|---|---|
| Identite | Nom du site, promesse, description, e-mail, telephone, annee, mention legale (`PUT /api/site`) |
| Contenu des pages | Les 18 rubriques : navigation, pied de page, reseaux, chiffres, fonctionnalites, etapes, valeurs, offres, FAQ, equipe, jalons, canaux de contact, bureaux, arguments de connexion, indicateurs, confidentialite, journal de securite, plateformes |
| Temoignages | File de relecture : publier, refuser, supprimer les avis ecrits par les membres |
| Communautes | Repertoire de la page Communautes (l audience affichee reste une mesure, non modifiable) |

Chaque rubrique sait de quels champs elle est faite
(`src/components/admin/sections.tsx`) : le formulaire propose un texte long pour
une description, un selecteur d icone, une liste de liens pour une colonne de
pied de page, un choix de mesure pour un chiffre. Une entree peut etre creee,
depubliee (elle disparait du site sans etre perdue), deplacee dans sa rubrique ou
supprimee.

Deux choses ne s editent pas, et c est voulu :

- **les valeurs des chiffres** — une entree « chiffre » ou « indicateur » designe
  une mesure (comptes, pays, messages, disponibilite, latence...), que le serveur
  calcule ;
- **l audience des communautes et l auteur d un temoignage** — comptee sur les
  salons pour l une, lue sur le compte du membre pour l autre.

Apres chaque enregistrement, la page redemande le contenu au serveur : la barre
de navigation, les offres ou les temoignages changent immediatement, tels qu un
visiteur les verra. Masquer le lien ne protege rien : c est le serveur qui refuse
les ecritures (403) a tout compte sans le role `admin`.

---

## Performance et qualite

Lighthouse, `npm run build && npm run preview` : **100 / 100** en mobile comme
en bureau, et sur les vingt et une pages du site, pas seulement sur l accueil.

| Mesure | Avant | Apres |
|---|---|---|
| First Contentful Paint | 2,8 s | 0,7 s |
| Largest Contentful Paint | 3,2 s | 1,4 s |
| Speed Index | 4,7 s | 0,85 s |
| Total Blocking Time | 0 ms | 10 ms |
| Cumulative Layout Shift | 0 | 0 |

(mediane de six mesures, profil mobile ; en bureau, 0,2 s / 0,3 s / 0,35 s.)

Une precision sur la deuxieme ligne : le Largest Contentful Paint de ce tableau
est une estimation du simulateur, pas le moment de la peinture. Voir « Le LCP
affiche est une estimation, pas une mesure ».

Ce qui a change, dans l ordre de ce que ca a rapporte.

### Le document seul suffit a peindre la page

`index.html` porte un squelette statique du haut de l accueil : le fond, la
barre et le heros, avec les classes de la vraie page pour que le passage de l un
a l autre ne deplace rien. Il s affiche des la premiere reponse du serveur, sans
attendre ni le paquet JavaScript ni l API — et ses liens sont de vrais liens,
qui marchent avant React. `SiteProvider` le retire quand il a de quoi peindre,
ou pour laisser voir le message d erreur si le serveur ne repond pas.

La phrase de presentation, elle, vient du serveur. Le `<script>` du `<head>`
lance les trois appels de l accueil des sa premiere ligne — en parallele du
telechargement du paquet, au lieu de l attendre — et pose la phrase a la place
que le squelette lui reserve. `src/lib/api.tsx` recupere ensuite ces memes
reponses au lieu de refaire l aller-retour.

### Plus rien ne bloque le premier rendu

- **Les styles du squelette sont dans le document.** `beasties`, branche dans
  `vite.config.ts`, lit le squelette a chaque construction, en extrait les
  regles qui s y appliquent (11 Ko) et les ecrit dans le `<head>` ; le reste de
  la feuille part en chargement differe. Rien n est recopie a la main.
- **Le paquet de l application part apres la premiere image peinte.** Demande en
  meme temps que le document, il lui prenait sa bande passante : pres d une
  seconde d affichage en plus, pour du code dont le squelette n a pas besoin.
- **Inter et Sora sont servies par le site**, plus par Google Fonts : la feuille
  distante bloquait le rendu et coutait deux connexions vers un autre domaine.

### Moins d octets sur le chemin critique

- **Polices reduites a ce que le site ecrit** — latin, accents, ponctuation — et
  aux graisses employees : 73 Ko a 49 Ko. Les fichiers sont dans `public/fonts/`.
  Pour les regenerer, reprendre les `woff2` de Google Fonts et les passer dans
  `fontTools` (`subset` sur ces plages, puis `varLib.instancer` sur `wght`).
- **Socket.IO sort du paquet initial.** `lib/auth-storage.tsx` appelait
  `closeSocket()` directement : une ligne qui embarquait 40 Ko de temps reel sur
  chaque page, alors que seule la messagerie ouvre une connexion. La fermeture de
  session passe maintenant par un evenement, ecoute par `lib/socket.tsx` — donc
  seulement si ce module est charge.
- **Chaque page porte sa feuille.** La feuille commune decrivait les vingt et une
  pages du site : sur l accueil, les trois quarts de ses regles ne servaient a
  rien (« Reduce unused CSS », 12 Ko de gaspillage sur 17 Ko transferes). Les
  regles propres a une page sont sorties dans `styles/pages/<page>.css`, et les
  sept fonds que l accueil n affiche pas dans `styles/backgrounds/<fond>.css` ;
  chaque page importe les siennes, donc elles partent avec elle. Ne restent en
  commun que la coquille (barre, pied, bandeau), l accueil, le fond `aurora` et
  les regles qu au moins cinq pages partagent. La feuille initiale passe de
  96 Ko a 62 Ko, et l audit tombe a zero octet inutilise.
  Le partage est calcule, non devine : un script suit le graphe d imports depuis
  chaque route pour savoir quelles pages atteignent quelle classe, et laisse en
  commun toute regle qu une regle commune plus tardive surchargeait — l ordre de
  la cascade est donc preserve.
- **Le document lui-meme est minifie.** Les fichiers emis a cote l etaient depuis
  toujours, mais `index.html` partait tel qu il est ecrit : commentaires compris,
  script d amorcage et styles du squelette en clair. Or c est le seul fichier du
  chemin critique. La passe `shrinkDocument` de `vite.config.ts` reduit les blocs
  `<script>` (rolldown) et `<style>` (lightningcss) puis retire les commentaires :
  38,6 Ko a 26,2 Ko. L espacement entre balises n est pas touche — une espace
  retiree entre deux elements en ligne deplacerait le texte.
- **La demande de connexion est chargee a la demande.** `RequireAuth` montait
  `AuthPrompt` depuis le paquet initial, alors qu elle ne s affiche qu a un
  visiteur anonyme qui pousse la porte de `/chat` ou `/admin` : son code, son fond
  `orbits` et le fond `pulse` du refus de droits pesaient sur la premiere visite.
- **L ecran d attente tient la hauteur d une page.** A `62vh`, le pied de page
  remontait sous le chargeur d une page chargee a la demande, puis redescendait
  quand elle arrivait : le plus gros decalage de mise en page du site
  (CLS 0,22, et jusqu a 1,36 sur `/confirmation`). Il est maintenant a zero
  partout.
- **Le repli local des polices est recale** sur les metriques d Inter et de Sora
  (`size-adjust`), et **le theme est applique par le document** : la page ne
  passe plus du sombre au clair sous les yeux du visiteur.

### Rien n arrive apres coup dans le premier ecran

Le Speed Index ne compte pas le moment ou la page s affiche, mais celui ou elle
cesse de changer. Trois elements du premier ecran arrivaient encore avec React,
une seconde apres le reste ; ils sont maintenant peints avec le squelette.

- **Le bandeau des cookies**, le plus gros des trois : il occupe le tiers bas
  d un ecran de telephone, et il tombait dessus d un coup. Il est ecrit dans
  `index.html`, avec le texte et les classes de
  `components/layout/CookieConsent.tsx` — celui que React met a sa place ne
  bouge pas d un pixel, et ne rejoue pas son entree en fondu
  (`.cookies--instant`, meme raisonnement que `.page--instant`). Repondre avant
  l arrivee du paquet fonctionne : « Tout accepter » et « Tout refuser »
  ecrivent le choix la ou `lib/cookie-consent.tsx` le lit, « Personnaliser »
  retient la demande et React ouvre le panneau en se montant. Et le visiteur
  qui s est deja prononce ne voit rien : le script du `<head>` marque la racine
  du document, une regle du meme `<head>` efface le bandeau avant la premiere
  image.
- **Le nombre de pays** du bandeau du heros : le squelette annoncait « partout
  dans le monde », React ecrivait « en direct dans 7 pays ». La reponse de
  `/api/stats` est la bien avant lui, le document ecrit donc la phrase
  definitive.
- **L icone du bouton de theme** : le squelette montrait toujours un soleil,
  meme sur le theme clair, ou React posait une lune. Les deux icones sont dans
  le document, le `<head>` n en laisse qu une.

Deux regles de ce genre vivent dans le `<head>` plutot que dans `boot.css` :
elles se reconnaissent a un attribut pose a l execution, que `beasties` ne voit
pas dans le document tel qu il est ecrit — il les renvoyait a la feuille
differee, donc apres la premiere image.

**Et la place reservee est la bonne.** Les six barres qui attendent la phrase de
presentation mesuraient 1,07 ligne a elles six : en arrivant, le texte poussait
les deux boutons 57 pixels plus bas. Chaque barre occupe maintenant exactement
une ligne (`1lh`), et il y en a quatre au-dela de 760 px, ou le paragraphe
s elargit jusqu a son plafond de 56 caracteres. Le premier ecran ne bouge plus,
ni sur telephone ni en bureau.

### Les pages hors de l ecran ne sont plus mises en page

L accueil tenait ses 100 depuis longtemps ; les pages interieures, elles, se
tenaient a la limite. `/features`, la plus fournie, tombait a 97 : son Total
Blocking Time oscillait entre 90 et 200 ms, la seule mesure du site a ne pas
valoir 1,00 — tout le reste y etait parfait.

Le profil ne montrait presque pas de JavaScript : 250 ms en tout, dont 67 ms
d evaluation du paquet. La tache longue etait ailleurs, dans une mise en page de
**419 boites sur 636** — l arbre entier de la page, calcule d un coup au montage
de React, alors que le visiteur n en voit que le premier ecran.

Les sections qui suivent la premiere sont donc declarees
`content-visibility: auto` : le navigateur saute leur mise en page et leur
peinture tant qu elles n approchent pas de l ecran.
`contain-intrinsic-size: auto 600px` leur reserve une hauteur en attendant, et
le mot-cle `auto` fait retenir la hauteur reelle des qu elle a ete calculee une
fois — la barre de defilement ne sautille pas, et rien ne bouge a l ecran :
`CLS` reste a zero partout.

La premiere section est exclue : elle est visible d emblee, la sauter
n ajouterait qu un aller-retour de mise en page. L exclusion vaut aussi pour les
pages qui n ont qu une seule section, longue et pourvue d un sommaire colle
(mentions legales, conditions, administration), ou aucune hauteur de
remplacement ne serait juste.

| `/features`, profil mobile | Avant | Apres |
|---|---|---|
| Score | 97 a 100 (mediane 99) | **100** sur cinq mesures |
| Total Blocking Time | 117 ms | 13 ms |

### Le paquet ne s evalue plus d une seule traite

Le score etait acquis, mais le Total Blocking Time de l accueil restait le seul
chiffre a bouger d une mesure a l autre : 3 ms sur une passe, 163 ms sur la
suivante. Le profil designait toujours la meme coupable, et ce n etait plus la
mise en page : **l evaluation du paquet**. Trois cent kilo-octets — React,
`react-dom`, le routeur, la coquille et l accueil — forment un seul graphe de
modules, et le navigateur evalue un graphe d un seul tenant. Une tache de 17 ms
sur cette machine, de 90 ms sur un telephone : la plus longue du chargement.

Le point d entree ne les importe donc plus. Il reclame `react-dom` et l arbre de
l application (`src/AppTree.tsx`) par deux appels dynamiques lances ensemble :
deux graphes independants, deux taches d evaluation, dont aucune n atteint le
seuil a partir duquel Lighthouse compte du temps de blocage.

La coupure ne coute pas un aller-retour de plus. Sans rien dire, le navigateur
ne decouvrirait ces deux paquets qu une fois l entree evaluee ; `vite.config.ts`
les annonce donc avec elle. Le plugin lit le graphe emis a la construction, part
des appels dynamiques ecrits dans l entree, suit leurs imports statiques — et
s arrete la : les appels dynamiques plus loin dans le graphe sont les pages, et
elles n ont aucune raison de partir avec l accueil. Les adresses obtenues
rejoignent la liste de prechargement deja posee apres la premiere image peinte.

Deux autres taches ont maigri au passage :

- **Le tiroir mobile n existe qu une fois ouvert.** Il reprend toute la
  navigation — une icone, un titre et une description par entree, plus les
  sous-menus — soit une centaine de noeuds montes a chaque visite pour un
  panneau que personne n a demande. Sa coquille reste en place, car c est elle
  que designe `aria-controls` ; son contenu arrive au premier clic. L accueil
  passe de 580 a 471 elements.
- **Les compteurs de chiffres n occupent plus React.** Une seconde et demie
  d animation, c est une centaine d images : autant de rendus et de recalculs de
  style pour quatre nombres, et ils tombaient exactement dans la fenetre
  mesuree. `useCountUp` rend maintenant une reference et ecrit le texte dans le
  noeud ; a l ecran, rien ne change.
- **Le pied de page passe en `content-visibility: auto`**, comme les sections :
  c est une centaine de boites de plus — quatre colonnes de liens — toujours
  hors de l ecran au premier rendu.

| Accueil, profil mobile | Avant | Apres |
|---|---|---|
| Total Blocking Time, moyenne | 38 ms | **23 ms** |
| Total Blocking Time, pire mesure | 163 ms | **83 ms** |
| Score | 100 (98 sur une passe) | **100 partout** |

(35 mesures avant, 48 apres, alternees dans la meme session pour absorber la
charge de la machine ; FCP, LCP, Speed Index et CLS sont inchanges, et le profil
bureau reste a 0 ms.)

Une piste a ete essayee puis abandonnee : differer le montage de tout ce qui est
sous la ligne de flottaison jusqu apres la premiere image. La mise en page de
l accueil se coupait bien en trois, mais le Speed Index simule y perdait 190 ms
pour un Total Blocking Time qui ne descendait pas plus bas que la separation des
paquets. Le code a ete retire.

### Les fonds tiennent enfin leur promesse

La regle que ce README enonce plus bas — *animations sur le compositeur
uniquement* — etait fausse pour deux fonds sur huit.

- **`mesh`** (page Fonctionnalites) interpolait `border-radius` sur ses trois
  blobs. Ce n est pas une propriete du compositeur : le navigateur recalculait
  le style puis repeignait trois surfaces de 58 vmax floutees a 60 px, a chaque
  image. Le galbe est maintenant pose une fois pour toutes, propre a chaque
  blob, et seule la rotation le fait vivre — sous un tel flou, la difference ne
  se lit pas.
- **`mesh` et `grid`** (page A propos) faisaient glisser leur grille par
  `background-position`, qui repeint la couche entiere. Le motif passe dans un
  enfant deborde d une case, deplace par `transform` et decoupe par le masque —
  immobile — du parent. Le pas vaut exactement une case : le raccord ne se voit
  pas. La capture de `/about` est identique au pixel pres avant et apres.

### Mesurer un changement sans se tromper

Les deux scripts d audit ne servent pas au meme usage.

`npm run perf:audit` construit, sert `dist/` sur le port 4173 et note les vingt
et une routes. Il jette trois passes de chauffe (un Chrome neuf gonfle le temps
de blocage d un facteur cinq a dix) puis prend la **mediane metrique par
metrique** sur `--runs`. Prendre la mediane par score, comme il le faisait,
n ordonne plus rien une fois toutes les routes a 100 : la passe retenue pour
representer les autres apportait alors le temps de blocage qu elle avait tire au
sort.

`npm run perf:ab` repond a la seule question qui compte devant un candidat
d optimisation : est-ce que ca change quelque chose ? Il sert deux builds en
meme temps — la reference dans `dist-base` sur le port 4174, le candidat dans
`dist` sur 4173 — aux **memes chemins**, et alterne les passes A, B puis B, A.
Une machine qui se charge pendant la serie frappe alors les deux cotes de la
meme facon, ce qu une mesure avant/travaux/mesure apres ne garantit jamais.

Deux precautions, apprises a mes depens :

- **Ne jamais monter le second build sous un prefixe d URL** (`/_base/press`).
  Le routeur ne reconnait pas le chemin invente, rend la page 404 — bien plus
  legere — et le build compare parait meilleur pour une raison qui n a rien a
  voir avec lui. D ou les deux ports.
- **Les deux cotes doivent joindre l API.** Le backend n autorise en CORS que
  les origines de `CLIENT_URL` : y ajouter `http://localhost:4174` le temps de
  la comparaison, faute de quoi le cote refuse mesure une page degradee et
  gagne pour la meme mauvaise raison.

Avant de croire un ecart, `npm run perf:ab:null` met le meme build des deux
cotes : tout ce qu il affiche est du bruit. Sur cette machine, `/press` a quinze
passes donne un temoin de 12 ms de temps de blocage et 3 ms de Speed Index — mais
a six passes, encore 60 ms et 220 ms. Les passes individuelles d un meme build
s etalent de 25 a 182 ms. En dessous de l ecart du temoin, il n y a rien a lire.

### Le LCP affiche est une estimation, pas une mesure

Le Largest Contentful Paint du tableau plus haut n est pas le moment ou le
visiteur voit la page : c est l estimation de Lantern, le simulateur de
Lighthouse. Le LCP **observe** vaut 205 a 253 ms selon la route, et il est
chaque fois egal au FCP observe — le squelette peint le plus grand element des
la premiere image, ce qui est exactement ce qu on lui demande.

L audit `metrics` porte les deux valeurs cote a cote. Sur l accueil :

| Champ de l audit `metrics` | Valeur |
|---|---|
| `observedFirstContentfulPaint` | 235 ms |
| `observedLargestContentfulPaint` | 235 ms |
| `largestContentfulPaint` | 1525 ms |
| `interactive` | 1525 ms |

Les deux dernieres lignes donnent l indice, et elles restent collees l une a
l autre sur toutes les routes mesurees : la valeur affichee est accrochee au
meme noeud de graphe que `interactive`. Elle suit donc le moment ou le graphe de
dependances se tasse, pas celui de la peinture.

Deux verifications le confirment. Un build dont l amorceur est retire des vingt
et un documents rapporte toujours 1508 ms **sans une ligne de JavaScript
applicatif** ; et le Speed Index y retombe a la valeur du FCP, avec un CLS nul —
l ecran est definitif des la premiere image.

D ou la consequence pratique : **ne pas chercher a faire baisser ce chiffre.** A
1,5 s il note deja 1,00 — le seuil mobile est a 2,5 s — donc il ne coute rien,
et remanier la page pour le faire descendre optimiserait le simulateur plutot
que le visiteur. Pour juger un candidat d optimisation, lire
`observedLargestContentfulPaint` dans l audit `metrics`, pas le chiffre du
rapport.

### Ce qui l etait deja

- **Chargement differe par route** (`React.lazy` + `Suspense`) : seul l accueil
  est dans le paquet initial, chaque page pese entre 2 et 15 Ko.
- **Animations sur le compositeur GPU uniquement** (`transform` / `opacity`) :
  aucun timer JavaScript pour les fonds, donc aucun reflow. L entree animee des
  pages est neutralisee au premier affichage seulement (`.page--instant`) : le
  squelette a deja peint ce contenu, la rejouer le ferait clignoter.
- **IntersectionObserver** pour les apparitions au defilement, deconnecte des
  qu il a fait son travail ; ecoute du defilement en mode `passive`.
- **Aucune dependance UI externe** : icones, logo et animations sont inline.
- `npm run build`, `tsc -b` et `npm run lint` passent sans erreur ni avertissement.

## Referencement

Le site est une application d une seule page : l hebergeur renvoie le meme
document pour `/`, `/features` ou `/pricing`, et tout le contenu arrive ensuite
par JavaScript. Trois consequences, qu on ne voit pas en naviguant :

- le document portait **le titre et la description de l accueil sur les vingt
  adresses**, sans URL canonique ;
- un lien partage vers les tarifs montrait **l apercu de l accueil** : les
  reseaux sociaux lisent le HTML, ils n executent jamais de JavaScript ;
- il n y avait ni `robots.txt`, ni `sitemap.xml`, ni donnees structurees, et les
  anciennes adresses francaises repondaient **200 sur les deux versions** de
  chaque page, faute de redirection cote serveur.

### Un seul point de verite

`src/lib/seo.ts` decrit chaque adresse une fois : titre, description, surtitre,
`<h1>`, accroche, ouverture a l indexation, poids dans le plan du site. Ce
fichier est lu des deux cotes de la construction —

| Qui | Quand | Ce qu il en fait |
|---|---|---|
| `vite.config.ts`, greffon `seo()` | a la construction, dans Node | un fichier HTML par adresse, plus `robots.txt`, `sitemap.xml`, `_redirects` et `_headers` |
| `src/hooks/useSeo.tsx` | dans le navigateur, a chaque changement d adresse | repose les memes balises quand `react-router` change de page sans recharger |

— ce qui rend impossible qu une page ait un titre dans le document et un autre
apres le montage de React. Ajouter une page au site, c est ajouter une entree a
`ROUTES` : elle apparait du meme coup dans le plan du site, dans le pre-rendu et
dans les balises posees a la navigation.

### Ce que `npm run build` ecrit maintenant

```
dist/
├─ index.html              l accueil
├─ features/index.html     … et une page par adresse, chacune avec son
├─ pricing/index.html      <head> complet et son <h1> en HTML pur
├─ …
├─ 404.html                page d erreur, en noindex
├─ robots.txt
├─ sitemap.xml             les 16 adresses ouvertes a l indexation
├─ _redirects              les 19 anciennes adresses francaises, en 301
└─ _headers                en-tetes de securite et de cache
```

Chaque page pre-rendue porte : `<title>` et description propres, `rel=canonical`,
`og:*` et `twitter:*` complets avec image, `robots` (`noindex, follow` sur les
pages fermees), et un bloc `application/ld+json` reunissant `Organization`,
`WebSite`, `WebPage`, `BreadcrumbList` et, sur l accueil, `SoftwareApplication`.
Les styles critiques sont extraits **page par page** : le heros interne n emploie
pas les memes regles que celui de l accueil.

Trois pages completent ce bloc a l execution, avec ce que seule l API sait :
les offres et leurs prix (`/pricing`), les questions frequentes (`/help`), les
coordonnees de l editeur (`/contact`). Les modifier depuis l administration
change aussi les donnees structurees, sans redeployer.

### L adresse du site

Tout ce que lisent les moteurs est absolu. `VITE_SITE_URL` porte l adresse
publique, et c est **la seule valeur a poser le jour de la mise en ligne** :

```bash
VITE_SITE_URL=https://votre-domaine.com
```

Absente, le site retombe sur `DEFAULT_ORIGIN` (`src/lib/seo.ts`).

### Ce que l hebergeur doit faire

Deux regles, et le reste suit.

1. **Servir les pages pre-rendues.** `/features` doit rendre
   `features/index.html`. Netlify, Cloudflare Pages, Vercel, GitHub Pages et
   `nginx` le font par defaut ; pour `nginx`, c est `try_files` :

   ```nginx
   location / {
     try_files $uri $uri/index.html $uri.html /404.html;
   }
   ```

2. **Renvoyer 404 sur une adresse inconnue**, et non l accueil en 200 — sinon un
   moteur indexe autant de doublons qu on lui invente d adresses. C est la
   derniere ligne de `_redirects`, reprise ci-dessus par `/404.html`.

`dist/_redirects` et `dist/_headers` sont au format Netlify / Cloudflare Pages
et sont pris en compte sans configuration. Ailleurs, les redirections 301 des
anciennes adresses francaises sont a recopier dans la syntaxe de l hebergeur —
la liste fait foi dans `LEGACY_REDIRECTS` (`src/lib/seo.ts`).

### Apres la mise en ligne

- declarer le site dans la Google Search Console, puis y soumettre
  `https://votre-domaine.com/sitemap.xml` ;
- verifier une page dans le test des resultats enrichis et dans le validateur de
  cartes de Twitter / LinkedIn ;
- renseigner `SAME_AS` (`src/lib/seo.ts`) le jour ou des comptes officiels
  existent : c est ce qui relie le site aux profils qui parlent de lui.

### Les images de marque

`public/og-image.png`, `public/apple-touch-icon.png` et `public/icon-512.png`
sont produites par un script, et non exportees depuis un outil de dessin : un
export serait une piece opaque, impossible a corriger sans rouvrir l outil.

```bash
node scripts/brand-images.mjs
```

La bulle et le globe y sont decrits par les memes mesures que
`public/favicon.svg`. Rien a installer : `zlib` suffit a ecrire un PNG. A
relancer apres une retouche du logo.

---

## Accessibilite

Lien d evitement, navigation au clavier complete, `:focus-visible` visible,
`aria-*` sur les etats interactifs (menu, accordeon, filtres, formulaires),
contrastes conformes et respect de `prefers-reduced-motion` (les animations sont
neutralisees, le design reste intact).

---

## Branchement du backend

Le front est branche sur le `BackendChatLiveProject`. Deux fichiers font
toute la liaison, et rien d autre ne connait l adresse du serveur :

| Fichier | Role |
|---|---|
| `src/lib/api.ts` | client HTTP : adresse du serveur, jeton ajoute a chaque appel, erreurs traduites en `ApiError { message, field, status }`, puis un groupe de fonctions par ressource (`authApi`, `roomsApi`, `communitiesApi`, `contactApi`, `usersApi`, `siteApi`, `statsApi`, `showcaseApi`, `testimonialsApi`, `newsletterApi`). |
| `src/lib/socket.ts` | connexion Socket.IO (une seule par onglet, meme jeton que l API), plus l abonnement a son etat de connexion pour `useSyncExternalStore`. |

Ce qui passe par l un ou par l autre :

| Ecran | Source |
|---|---|
| Inscription, connexion, session, deconnexion | `POST /api/auth/register` · `/login` · `GET /me` · `POST /logout` |
| Confirmation de l adresse | `POST /api/auth/verify` (code a six chiffres, rend la session) · `/verify/resend` |
| Continuer avec Google (les deux pages) | `POST /api/auth/google` : le jeton rendu par Google contre une session ChatLive, compte cree au passage s il n existe pas |
| Messagerie — salons, fil, membres | `GET /api/rooms`, `/:id/messages`, `/:id/members`, `POST /:id/read` |
| Messagerie — envoi | `POST /api/rooms/:id/messages` (la reponse porte le message enregistre) |
| Messagerie — reception, frappe, presence | socket : `message:new`, `message:updated`, `message:deleted`, `typing`, `presence:update`, `room:member-joined` / `-left`, `room:updated` / `-deleted` |
| Communautes | `GET /api/communities` et `/topics` ; l audience affichee est comptee sur les salons rattaches a chaque communaute, pas stockee |
| Contact | `POST /api/contact` (le jeton est joint si le visiteur est connecte), sujets proposes par `GET /api/contact/subjects` |
| Contenu des pages vitrines | `GET /api/site` : identite, navigation, pied de page, fonctionnalites, offres, FAQ, equipe, jalons, bureaux, temoignages, pays |
| Chiffres affiches | `GET /api/stats` : comptes, pays, langues, messages, disponibilite et latence mesurees, rafraichis toutes les minutes |
| Apercu de l accueil et des pages de connexion | `GET /api/showcase` : salon vitrine, ses derniers messages, membres en ligne, pays representes |
| Lettre mensuelle (pied de page) | `POST /api/newsletter` : l adresse est reellement enregistree |

`src/hooks/useChat.ts` reunit les deux voies : l API pour le chargement et
l envoi (une reponse, une erreur exploitable), la socket pour tout ce qui
arrive des autres. Les fusions sont idempotentes — le serveur renvoie a
l expediteur le message qu il vient de poster, l identifiant fait foi.

`src/types/socket.ts` est la copie du contrat serveur
(`BackendChatLiveProject/types/socket.ts`) : nom et charge utile de chaque
evenement sont verifies a la compilation des deux cotes du fil.

L apercu des pages publiques (accueil, demande de connexion, colonne des pages
d authentification) vient de `GET /api/showcase`. Seuls les salons marques
« vitrine » par un administrateur peuvent y figurer : une conversation ordinaire
ne sort jamais de ses membres.
