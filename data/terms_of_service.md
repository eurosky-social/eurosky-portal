# Eurosky PDS and Portal – Terms of Service

_Effective date: 11 June 2026_

## Part 1: Introduction

### 1. Welcome

Welcome. These Terms of Service ("**Terms**") govern your use of three services operated by **Stichting Modal**, a non-profit foundation established under the laws of the Netherlands and registered at Kranenburgweg 135 A, 2583 ER The Hague (RSIN 868779465):

- the **Eurosky Personal Data Server (PDS)**, our infrastructure for hosting your identity, posts, and other public records on the AT Protocol;
- the **Eurosky Portal**, a front-end at [portal.eurosky.tech](https://portal.eurosky.tech) for managing your Eurosky account and discovering applications on the open social web;
- **mu**, a social application by Eurosky that lets you read, post, and follow conversations across the open social web.

In these Terms, "**we**", "**us**", and "**our**" mean Stichting Modal. "**You**" means anyone using one or more of these services.

Eurosky is Modal's programme to build sovereign social infrastructure for Europe.

If you are using any of our services as a consumer in the EU or EEA, nothing in these Terms takes away rights you have under your local consumer protection laws. Where these Terms conflict with mandatory consumer law that applies to you, the mandatory law wins.

### 2. What these Terms cover, and which Parts apply to you

These Terms are organised in four Parts.

**Part 1** (this Part) introduces the services and these Terms.

**Part 2** sets the common rules that apply to everyone using any of our services. If you have any relationship with us as a user, Part 2 applies to you.

**Part 3** covers the **Eurosky PDS and Portal**. It applies to you if you have a Eurosky account. You have a Eurosky account if you signed up directly through the Eurosky Portal, or if you signed up through mu (which creates a Eurosky account for you automatically). If you use mu with an account hosted on a different PDS provider, Part 3 does not apply to you.

**Part 4** covers **mu**. It applies to you if you use mu, regardless of where your account is hosted. If you have a Eurosky account but never use mu, Part 4 does not apply to you.

The three common user paths:

1. You have a Eurosky account and you do not use mu. Parts 1, 2, and 3 apply to you. Part 4 does not.
2. You have a Eurosky account and you use mu. Parts 1, 2, 3, and 4 all apply to you.
3. You use mu with an account on a different PDS provider. Parts 1, 2, and 4 apply to you. Part 3 does not.

In each Part below, the applicability is restated at the top of the Part for clarity.

### 3. The protocol and the network

The Eurosky PDS, the Eurosky Portal, and mu all run on the Authenticated Transfer Protocol (the [AT Protocol](https://atproto.com/), or **ATProto**), an open standard for social networking. ATProto is to social what SMTP is to email: a protocol many applications can speak, none of them owns. The network of applications and services running on ATProto is known as **The Atmosphere**.

This has three practical consequences for everyone using any of our services:

- **Your account is portable.** Your identity, follows, and posts can move with you to other ATProto applications and to other infrastructure providers. We design for the exit, not just for the entry. See §20 for the mechanics.
- **What you post on the open social web is public by default.** Posts, profile, follows, likes, and blocks are visible to anyone, on our services and on other ATProto applications that choose to display them. We say more about visibility in the Privacy Policy.
- **Other ATProto applications and operators exist and we don't control them.** Third-party applications and PDS providers on the AT Protocol are operated by other parties, with their own terms. We are not responsible for their content or practices. See §14.

---

## Part 2: Common terms

_Applies to everyone with a Eurosky account or who uses mu, regardless of the path you took to get here._

### 4. Eligibility

The minimum age depends on which of our services you are using:

- Eurosky PDS and Portal: you must be at least **16 years old**.
- mu: you must be at least **18 years old**.

If you signed up via mu and we created a Eurosky account for you in the same flow (see §22), you will only be able to use mu if you are 18 or over. If you are 16 or 17, you will be able to use the Eurosky account but will not be able to access mu.

We will ask you to confirm that you meet the applicable minimum age when you sign up or sign in. Where local law requires further methods of age assurance, we will introduce them over time. Methods we anticipate adopting may include verified payment card checks and zero-knowledge proof of age via the EU Digital Identity system. We aim to adopt the least intrusive method that meets the legal requirement. We do not retain biometric data, ID documents, or images supplied to age-assurance vendors. We will not use facial age estimation.

If we have reasonable grounds to believe a user is below the applicable minimum age for the service they are using, we will suspend their access until age is confirmed and, failing confirmation, terminate the account or the relevant access.

If you are using our services on behalf of an organisation, you confirm you have authority to bind that organisation to these Terms.

### 5. Your account

You access our services using your AT Protocol account. If your account is hosted on the Eurosky PDS, we run that infrastructure (see §16). If your account is hosted elsewhere, your PDS provider's terms govern the hosting layer, and these Terms cover your use of the services we operate.

mu authenticates you using OAuth via your account provider. Your sign-in credentials, including your password and any second factor, are held by your account provider, not by us.

You are responsible for keeping your sign-in credentials secure and for activity that happens under your account.

If your account is taken over or used without your permission:

- if your account is on the Eurosky PDS, tell us as soon as possible at [support@eurosky.tech](mailto:support@eurosky.tech) so we can help you recover it and protect anyone affected;
- if your account is on a different PDS, contact your PDS provider directly; they hold your credentials and the controls you need. You can also let us know at [support@mu.social](mailto:support@mu.social) if the compromise is affecting how the account is used on mu.

Do not share your account. Do not use anyone else's account.

Your account handle is public. Choosing a handle that impersonates a real person, an institution, or a brand is not allowed except in clearly labelled cases such as parody or fan accounts. The mu Community Guidelines describe this in detail.

### 6. Your content

"**Your Content**" means anything you post, upload, or send through any of our services, including posts, profile fields, photos, videos, lists, feeds, direct messages, and feedback.

You own Your Content. You don't give us ownership of it by posting it through our services.

You give us a limited, worldwide, non-exclusive, royalty-free licence to do the things that are necessary to provide our services to you and to other users, namely to:

- host, store, transmit, copy, and display Your Content so other users on our services and on other ATProto applications can see and interact with it;
- resize, reformat, and adapt Your Content as needed for different devices, contexts, and bandwidth;
- apply moderation, labelling, or restriction to Your Content under the mu Community Guidelines and our moderation policy (see §17 for the PDS layer and §23 for the mu layer);
- include Your Content in transparency reporting, in aggregate and de-identified statistics, and where required by law, in disclosures to authorities; and
- permit our infrastructure providers to access Your Content strictly to provide hosting and operations to our services.

The licence covers only what we operate. If your account is hosted on a third-party PDS (rather than on Eurosky's), points 1, 2, and 5 above apply only to the operational handling we do at the mu application layer when you use mu, not to hosting of your account on that other PDS.

The licence narrows as Your Content is removed:

- when you delete a specific piece of content, the licence over that content ends, subject to the qualifications below;
- when you delete your Eurosky account, the licence over content on the Eurosky PDS ends, subject to the qualifications below; if you continue to use mu using an account on a different PDS, the licence continues for content posted through that account;
- when you stop using mu (whether by revoking authorization or by deleting your account), the licence over mu-side caches and preferences ends, on the timeline set out in our Privacy Policy.

Two qualifications apply throughout:

- We may keep copies for a limited time for backups, abuse investigation, legal preservation, and similar legitimate purposes, as set out in our Privacy Policy.
- Because the AT Protocol is federated, copies of public content may persist on other operators' infrastructure outside our control. We will notify the wider network of your deletion, but we cannot force other operators to remove their copies. Federation also runs the other way: even after you stop using mu, public content involving you may continue to appear on mu, because mu fetches content from across the AT Protocol network rather than only from people who actively use mu. This includes content you posted before you stopped, and new replies, quotes, or reshares posted by others. This is a structural feature of any open protocol.

**Direct Messages on mu.** At launch, mu uses the Direct Message service provided by Bluesky Social, PBC as part of the wider Atmosphere. DMs sent through mu are routed through Bluesky's DM infrastructure. They are not end-to-end encrypted. Bluesky's Trust &amp; Safety can access them under Bluesky's own DM policies, in addition to our own moderation responsibilities described in §23. We will revisit this arrangement as the AT Protocol's DM facilities mature, and we will tell you if it changes materially.

**Content delivery on mu (at launch).** At launch, mu does not run its own indexer (an "appview" in AT Protocol terms). The posts, profiles, follows, and other public records shown in mu are fetched and served through the appview operated by Bluesky Social, PBC. This means that while you are using mu, your interactions and the content displayed to you transit Bluesky's infrastructure, even where your account is hosted on the Eurosky PDS or on a third-party PDS. We are building our own appview and will switch mu over to it as it becomes ready. We will tell you when the switch happens and explain the practical effect at that point.

We will never sell Your Content or any other personal data we hold about you. We will never profile you for advertising purposes.

We may use automated systems (including AI-based systems) to detect spam, abuse, and prohibited content under §7 and §23. At launch on mu, the systematic moderation signal we apply comes from Bluesky's labelling service; our own moderation systems are described in §23 and will be introduced in the near future. We describe how we do this in our Privacy Policy.

### 7. Acceptable use

The mu Community Guidelines govern conduct on mu in detail. They cover safety, harassment, privacy, authenticity, regulated goods, intellectual property, and platform security, and they apply only on mu. If you use mu, the Community Guidelines are part of these Terms.

At launch, our ability to enforce the Community Guidelines on mu is limited. We can suspend an account's access to mu, but we cannot yet hide or remove specific posts at the mu layer; the systematic moderation signal on mu at launch comes from Bluesky's labelling service, as described in §23. Full enforcement of the Community Guidelines on mu becomes possible once our own moderation layer is live (target summer 2026; see §23.2).

There is a related structural point to understand. Suspending an account from signing in to mu is not the same as removing the account's content from mu. Mu fetches content from across the AT Protocol network (see §6). Public content from any account on the network, including suspended accounts and accounts that have never used mu, may continue to appear on mu unless we take a separate moderation action against the specific content. At launch, our ability to act on specific posts at the mu layer is limited as described above. Once our own moderation layer is live, we will be able to apply specific actions to specific posts as well prevent content from specific accounts from appearing on mu.

The Community Guidelines themselves are a living document. We will be open to community feedback on them and will publish material changes through mu and through our public channels before they take effect.

In addition, and across all of our services (the Eurosky PDS, the Eurosky Portal, and mu), you specifically agree not to:

- store, possess, or distribute content where doing so is illegal under applicable law, including:
  - material that constitutes child sexually exploitative material, including material that may not amount to illegal child sexual abuse material but that nonetheless sexually exploits or promotes the sexual exploitation of minors, unlawful pornography, or that is otherwise indecent;
  - content that contains or promotes extreme acts of violence or terrorist activity, including terror or violent extremist propaganda;
  - content advocating bigotry, hatred, or the incitement of violence against any person or group of people based on their race, religion, ethnicity, national origin, sex, gender identity, sexual orientation, disability, impairment, or any other characteristic associated with systemic discrimination or marginalisation;

- violate the privacy or infringe the rights of others, including by publishing, sharing, or storing other people's confidential information, identifying information, or intimate imagery without authorisation, including for the purposes of harassing, exposing, harming, or exploiting them;
- attempt unauthorised access to accounts or systems;
- deploy malware or deliberately disrupt service availability;
- otherwise act unlawfully, including by storing, publishing, or sharing content that depicts, promotes, or instructs on illegal activity, is fraudulent, defamatory, misleading, or exploitative, or that infringes the intellectual property rights of others.

Breaking these rules can lead to action on your content or your account. The mechanics differ by service: §17 explains what we do at the PDS layer, §23 explains what we do on mu.

### 8. Service availability

We will use reasonable skill and care to keep our services available and to maintain the data you store with us. We do not promise uninterrupted service. We may take any of our services down for maintenance, security, or legal reasons. Where the law requires us to give advance notice of planned interruption, we will.

**Beta status.** The Eurosky Portal and mu are both currently in beta. Features may be added, changed, or removed as they develop. We will take reasonable steps to notify you of material changes. We provide both on a best-efforts basis under this section.

### 9. How we are funded

Our services are funded by Modal, through grants, donations, and programme revenue. We will never sell Your Content or other personal data we hold about you. We will never profile you for advertising purposes.

### 10. Disclaimers, our liability to you, and time limits on claims

Where the mandatory law of your country of residence gives you more rights than this section, that mandatory law wins.

#### 10.1 What we do not promise

We provide our services with reasonable skill and care. We do not promise that:

- our services will always be available, uninterrupted, error-free, secure against every possible threat, or free of bugs;
- any particular content, person, feed, or feature will be available or remain available;
- our services will be compatible with any particular device, browser, or third-party application;
- the content of other users, of operators of other ATProto applications, or of third parties is accurate, current, complete, lawful, or fit for any purpose you have in mind;
- our moderation decisions, including (once our own moderation layer is live, as described in §23) decisions to apply, decline to apply, or reverse a label or restriction from Bluesky or another provider, will satisfy any particular user.

Except as required by the mandatory law that applies to you, the services are provided "as is" and "as available", without warranties of merchantability, fitness for a particular purpose, or non-infringement beyond those that the law makes mandatory.

#### 10.2 What we are always liable for

Nothing in these Terms limits or excludes our liability for:

- death or personal injury caused by our negligence;
- fraud or fraudulent misrepresentation;
- gross negligence or wilful misconduct;
- any other liability that cannot lawfully be limited or excluded under the mandatory law that applies to you, including under EU consumer protection law and including conformity obligations under Directive (EU) 2019/770.

#### 10.3 What we are not liable for

Subject to §10.2, we are not liable for:

- indirect, special, incidental, punitive, or consequential losses, including loss of profits, loss of business, loss of opportunity, loss of goodwill, loss of data, loss of anticipated savings, or wasted expenditure;
- the costs of procuring substitute services;
- content posted by other users or by operators of other ATProto applications, or harm arising from your exposure to such content;
- the behaviour or decisions of other operators on the AT Protocol, including Bluesky Social, PBC;
- service interruption, suspension, or termination that complies with these Terms;
- delays or failures caused by events outside our reasonable control, as described in §10.6;
- moderation decisions made in good faith, except through the appeal routes set out in §26 and any rights local law gives you.

#### 10.4 Cap on our total liability

Subject to §10.2, our total cumulative liability to you for all claims arising out of or in connection with your use of any of our services or these Terms, whether in contract, tort, statute, or otherwise, is limited to one hundred euros (€100) in aggregate.

#### 10.5 Time limit on claims

You must notify us in writing of any claim within twelve (12) months of the date on which you became aware, or ought reasonably to have become aware, of the events giving rise to it. Claims you do not notify within that period are waived, except where the mandatory law that applies to you, or any statutory limitation period that cannot be shortened by contract (such as the Dutch Burgerlijk Wetboek Article 3:310 limitation period), provides otherwise. Notification by itself does not extend any statutory limitation period; you remain responsible for issuing proceedings within the time the law requires.

Before bringing a claim, you must give us a reasonable opportunity to investigate and, if appropriate, to remedy the issue. The appeal processes in §21 (Eurosky account) and §26 (mu) are the routes for moderation disputes; for other issues, write to [support@eurosky.tech](mailto:support@eurosky.tech) or [support@mu.social](mailto:support@mu.social) with a clear description of what happened, what you want, and any evidence you can share.

#### 10.6 Force majeure

We are not in breach of these Terms, and are not liable, for any failure or delay caused by events outside our reasonable control. These events include power or telecommunications outages, internet-backbone failures, denial-of-service attacks, malicious cyber activity, supply or service failures by third parties, action by government or regulatory authorities, court orders, natural events, public health emergencies, and labour disputes affecting us or our service providers. If a force-majeure event continues for more than 30 consecutive days, either of us may end the relationship under §21 or §29, with no further liability beyond what has already accrued.

### 11. Indemnification

#### 11.1 Consumers

If you use our services as a consumer, this section does not apply to you. We do not require an indemnity from you.

#### 11.2 Business and institutional users

This section applies if you use our services in the course of a trade, business, craft, profession, or public function, including if you use our services on behalf of any company, partnership, non-profit, public-sector body, or other organisation.

If you are such a user, you will indemnify, defend, and hold harmless Stichting Modal, its officers, directors, employees, contractors, and Eurosky's partner organisations, on demand and on a full-indemnity basis, against any and all losses, damages, fines, penalties, settlements, judgments, costs, and expenses (including legal and professional fees on a full-indemnity basis) that we incur arising out of or in connection with:

- your breach of these Terms, the mu Community Guidelines, the Copyright Policy, or our Trademark Policy;
- any claim by a third party that Your Content, or your use of our services, infringes that third party's intellectual property, privacy, publicity, or other rights;
- any regulatory finding, order, or fine arising from your conduct on our services;
- any breach by you of applicable law in connection with your use of our services.

We will tell you promptly about any claim covered by this indemnity. We may choose to defend the claim ourselves using counsel of our choice; if we do, you will cooperate fully with that defence and you will pay our reasonable costs. You will not settle any covered claim without our prior written consent.

### 12. Intellectual property

The Eurosky name and logo, the mu name and logo, and the design, code, and copy of our services are owned by Stichting Modal or licensed to us. You do not acquire any rights to them by using our services.

Parts of our services are built on open-source software, including software released under the MIT and Apache 2.0 licences. Your use of those components is governed by their respective licences. We publish a notice listing the components we use and their licences.

If you want to use the Eurosky or mu name or logo for anything beyond ordinary reference to the services (for example, "I posted this on mu" or "I have a Eurosky account"), see our Trademark Policy.

### 13. Information required under the Digital Services Act

We provide this information so that authorities, users, and others can contact us efficiently.

Single point of contact for Member State authorities, the European Commission, and the European Board for Digital Services (DSA Article 11): [notices@eurosky.tech](mailto:notices@eurosky.tech).

Single point of contact for recipients of the service (DSA Article 12): [dsa-support@eurosky.tech](mailto:dsa-support@eurosky.tech).

Point of contact supported languages: English, French, German, Dutch.

Member State of establishment: the Netherlands.

Statutory representative in the EU under DSA Article 13: not required, because we are established in the Netherlands.

Reporting and transparency: we publish DSA transparency reports annually at minimum, in line with Article 24 of the Digital Services Act (and Article 15 in respect of the Eurosky PDS as a hosting service). The first report will cover the period from the launch of mu through the end of our first reporting cycle; we will confirm the cycle dates and the publication date in our Transparency Centre once launch is established. We publish a single report covering our services together.

Trusted flaggers (DSA Article 22): notices submitted by entities awarded trusted flagger status by a Digital Services Coordinator are processed with priority.

Special protection of minors (DSA Article 28): the minimum age for mu is 18; the minimum age for the Eurosky PDS and Portal is 16 (see §4). Users aged 16 or 17 may hold a Eurosky account but cannot use mu. We do not present recommendations based on profiling of any user. If a user is found to be below the applicable minimum age, we suspend access and, failing age confirmation, terminate the account or the relevant access.

Note on protocol-level federation: because our services operate on the AT Protocol, content may be replicated to and accessed via other ATProto applications operated by third parties. Our DSA obligations cover what we do as intermediaries; they do not extend to the operations of other intermediaries on the network. See §14.

### 14. Other applications on the AT Protocol

Third-party applications and PDS providers running on the AT Protocol, such as Bluesky's social application, Flashes, Tangled, Semble, Leaflet, Blento, and others, are not operated by us and are not part of our services. Their terms, privacy practices, and moderation are their own.

When you post on our services, your public posts may be visible on other ATProto applications. When someone on another ATProto application replies to you or follows you, you may see that activity in our services. We do not control the other application's behaviour, and we are not responsible for it.

If you have a complaint about content or behaviour on a different ATProto application or PDS provider, please contact that operator directly. We will help you find the right contact where we can.

### 15. Governing law and forum

These Terms, and any non-contractual obligations arising out of them, are governed by the laws of the Netherlands.

If you are a consumer in the EU or the EEA, this choice of law does not deprive you of the protection of the mandatory rules of the law of the country where you have your habitual residence. You can bring a claim against us in the courts of your country of residence, and we can only sue you there.

If you are not a consumer (for example, you are using our services in the course of a business, or you are an institution), the courts of Amsterdam, the Netherlands have exclusive jurisdiction over any dispute, subject to mandatory rules that say otherwise.

We do not require you to go to arbitration. We do not ask you to waive class action or representative proceeding rights.

### 16. General terms

**These Terms are the whole agreement.** Together with the Privacy Policy, the mu Community Guidelines, and the Copyright Policy, these Terms are the complete agreement between you and us about your use of our services. They replace any earlier understanding, including any previous separate Eurosky Portal Terms of Service.

**If part of these Terms doesn't hold up, the rest does.** If a court or competent authority finds part of these Terms invalid or unenforceable, the rest stays in force, and the invalid part is reduced to the minimum extent needed to make it enforceable.

We may need to send you notices. We will send notices to you through the service you use, by email at the address linked to your account, or by another reasonable method. By using our services, you agree that electronic notices are acceptable.

**We don't lose rights by not enforcing them.** If we don't enforce a provision straight away, we can still enforce it later.

**Assignment.** You may not assign these Terms to anyone. We may assign these Terms to another entity within the Modal foundation structure, or to a successor non-profit, provided it is bound to the same charter and public-interest commitments.

**No third-party beneficiaries.** No one other than you and us has any right to enforce these Terms.

**Updates to these Terms.** We may update these Terms from time to time. If we make a material change, we will tell you through the relevant service or by email at least 30 days before the change takes effect, unless the change is required immediately by law. If you do not accept the change, you may end the relevant relationship under §21 or §29 and your acceptance ends. Continued use after a material change takes effect counts as acceptance.

---

## Part 3: If you use the Eurosky PDS or Portal

_This Part applies to you if you have a Eurosky account. You have a Eurosky account if you signed up directly through the Eurosky Portal, or if you signed up through mu (which creates one for you automatically). If you only use mu with an account hosted on a different PDS provider, this Part does not apply to you._

### 17. About the Eurosky PDS and the Portal

The Eurosky Personal Data Server is the infrastructure that hosts your AT Protocol identity and the data associated with it: your account, your handle, your posts, your follow graph, your other public records on the open social web. The PDS is not a social media platform; it does not provide feeds, rank posts, or curate speech. It is, in effect, the European mail address for your social identity on ATProto.

The Eurosky Portal is a front-end at [portal.eurosky.tech](https://portal.eurosky.tech) for managing your Eurosky account. From the Portal you can:

- create or sign in to your Eurosky account;
- view your profile information and the data stored in your PDS;
- browse and view images, videos, and other media stored under your account;
- discover compatible third-party AT Protocol applications via a featured-apps directory;
- use sign-in facilitation for selected third-party apps, where the Portal shares your handle with the application to streamline its sign-in flow;
- access account management and support links.

Modal, through Eurosky, operates the PDS and the Portal together. Your Eurosky account is a single thing; the PDS is the data layer and the Portal is one of the surfaces you can manage it through.

### 18. Where we host your data, and the Portal's beta status

**EU hosting.** Your Eurosky account, and the content stored under it, are hosted on cloud infrastructure provided by an EU-headquartered hosting provider, in data centres located within the European Union. At the time of writing, that provider is Hetzner Online GmbH (Germany). We may change provider, but we are committed to using only providers headquartered in the EU. The Eurosky PDS and Portal will not be hosted outside the EU. Some ancillary services (for example, email delivery or operational tooling) may be processed outside the EU under appropriate safeguards described in our Privacy Policy.

**Portal beta status.** The Eurosky Portal is currently in beta. Features may be added, changed, or removed as the Portal develops. We will take reasonable steps to notify you of material changes. We provide the Portal on a best-efforts basis under §8.

### 19. Portal features and third-party applications

**Featured-apps directory.** The Portal includes a directory of third-party AT Protocol applications. Clicking a featured app opens the third-party application's website in a new browser tab. The Portal does not transmit your personal data to those applications by default.

**Sign-in facilitation.** For selected third-party apps, the Portal may facilitate the sign-in process by sharing your handle with the destination app so that it can identify you and streamline its sign-in flow. Before any data is shared, the Portal will clearly inform you of what will be transmitted. Only your handle (and, where applicable, a marker identifying Eurosky as the referring service) is shared. The Portal does not share your OAuth access token, your email address, your password, or any other profile or account data with third-party apps through this feature.

**Data browsing.** The Portal may allow you to browse and view data stored in your PDS, such as images, videos, and other media. This data is retrieved from your PDS using your existing authentication and displayed to you within the Portal for your own use. The Portal does not share this data with any third party. Whether the Portal independently stores copies of this data, and if so for how long, depends on how this feature is implemented at launch; the current implementation status is described in our Privacy Policy and surfaced in-product.

**Third-party responsibility.** Once you leave the Portal and visit a third-party application, that application is operated by a third party and governed by its own terms and privacy policy. We are not responsible for the privacy practices or conduct of third-party applications.

### 20. Account portability and migration

Your Eurosky account is portable by design. At any time you may:

- Export your posts, profile, and follow graph from the PDS through standard ATProto export tooling.
- Move your Eurosky PDS account to another PDS provider on the AT Protocol, including providers we have no relationship with, using the standard ATProto migration flows.
- Use your Eurosky account in other ATProto applications, including third-party applications and including mu, without changing anything about where your account is hosted.

We do not impose technical or contractual barriers to leaving. If you find one, we treat that as a bug and will fix it.

### 21. Notices of illegal content, PDS-layer moderation, and ending your Eurosky account

#### 21.1 What moderation we do at the PDS layer

The Eurosky PDS is hosting infrastructure, not a curation platform. We do not pre-screen content stored on the PDS. We do not run feeds or labelling services at the PDS layer.

What we do at the PDS layer is limited and reactive, and is restricted to **legal compliance**:

- act on content that we are legally required to remove or restrict, including child sexual abuse material, content covered by an EU removal order under Regulation (EU) 2021/784, and content covered by a binding takedown order from a competent court or authority;
- respond to valid orders from competent EU authorities;
- protect the security and integrity of the service;
- address other clearly unlawful content where we are legally required to act.

When we act at the PDS layer, our action affects how the content is stored and federated. It does not depend on which application you used to post it.

Mu-layer moderation is a different thing. It is driven by the mu Community Guidelines and applies only to what mu users see. §23 describes it.

#### 21.2 Notices of illegal content

To notify us of illegal content on the Eurosky PDS, write to [notices@eurosky.tech](mailto:notices@eurosky.tech). We will follow the procedure required by Article 16 of the Digital Services Act. We will confirm receipt, decide whether action is required, and tell you the outcome with reasons. Trusted flaggers under Article 22 of the DSA are processed with priority.

If your notice relates to content that is being shown on a particular application (for example, mu) and you want action at that application's layer, the application's own reporting channel may also be appropriate; see §25 for the mu channel. The two channels are operated by the same Trust &amp; Safety team and feed into the same internal workflow; you do not need to send to both.

#### 21.3 Ending your Eurosky account

You may end your Eurosky account at any time. You have two options: deactivation (paused, handle held for you) and deletion (gone, handle immediately released).

**Deactivate your Eurosky account.** Deactivation pauses the account. The data stored under your account stays in place, you can come back later and reactivate, and your handle is held for you for 30 days from the moment of deactivation. If you reactivate within 30 days, your handle is still yours. After 30 days of continuous deactivation, the handle is released and may be re-registered by someone else; the account itself remains in its deactivated state until you reactivate, fully delete, or the additional deactivated-account retention period set out in our Privacy Policy (§20) expires. You can trigger deactivation from any compatible Atmosphere application that supports it, or by emailing [support@eurosky.tech](mailto:support@eurosky.tech).

**Delete your Eurosky account entirely.** You can trigger deletion of your Eurosky account from any compatible Atmosphere application that supports account deletion (for example Bluesky's social application). If you do not use any such application, email us at [support@eurosky.tech](mailto:support@eurosky.tech) and we will delete the account on your instruction. Deletion means:

- we begin deleting Your Content from the Eurosky PDS, on the timeline set out in our Privacy Policy;
- if you also use mu through this account, your mu access ends at the same time;
- we notify the wider AT Protocol network of your account deletion, although see §6 on the limits of network-wide deletion;
- we keep what we are required to keep for legal or trust-and-safety reasons, on the basis explained in our Privacy Policy;
- your handle is released immediately and may be re-registered by someone else. Deletion is permanent. If you want to preserve the option of coming back under the same handle, use deactivation instead.

**Migrate to another PDS provider.** As described in §20, you can move your Eurosky PDS account to another provider. After migration:

- your identity, posts, profile, and follow graph live on the new provider;
- the Eurosky PDS and Portal Part of these Terms (this Part 3) stops applying to you;
- if you continue to use mu with the migrated account, Part 4 continues to apply;
- your new PDS provider's terms govern hosting from that point.

#### 21.4 When we may end the relationship

We may suspend, restrict, or terminate your Eurosky account or specific features if:

- you seriously or repeatedly break these Terms, the mu Community Guidelines, or the Copyright Policy;
- we are required to by court order or by another binding legal order;
- your continued access poses a credible risk to other users, to the Eurosky PDS or Portal, to mu, or to third parties.

Where the law requires us to give you notice before suspending or terminating your Eurosky account, and where doing so would not itself cause harm or breach a legal obligation, we will do so.

---

## Part 4: If you use mu

_This Part applies to you if you use mu, regardless of where your account is hosted. If your account is hosted on the Eurosky PDS, Part 3 applies to you as well. If your account is hosted on a different PDS provider, only this Part 4 and the common Part 2 apply._

### 22. About mu

mu is a social application built on the AT Protocol. It is a place to read, post, and follow conversations across the open social web. It is one of many applications on The Atmosphere.

mu's design choices flow from the values set out in our Community Guidelines: plurality, healthy discourse, public interest, openness. Those values shape how we moderate and what tools we give you. At launch they shape our policies more than our recommender, because mu does not yet run its own recommender; the default feeds and the recommender signal at launch come from Bluesky's appview (see §6 and §24). Once our own appview is live, the recommender signal will become ours too.

mu is currently in beta (see §8).

**EU hosting.** mu is hosted on cloud infrastructure provided by an EU-headquartered hosting provider, in data centres located within the European Union. At the time of writing, that provider is Bunny.net (Slovenia). We may change provider, but we are committed to using only providers headquartered in the EU. Some ancillary services may be processed outside the EU under appropriate safeguards described in our Privacy Policy. Note that, as described in §6, at launch the public content shown in mu is delivered through Bluesky's appview and so transits Bluesky's infrastructure.

There are two ways to use mu.

**Sign up.** If you do not already have an account on The Atmosphere, signing up to mu creates a Eurosky account for you, hosted on the Eurosky PDS. Parts 2, 3, and 4 of these Terms apply to you. You do not need to accept a second set of terms to use the Eurosky PDS through mu; these Terms cover both layers.

**Sign in.** If you already have an Atmosphere account hosted on another PDS (for example, on Bluesky's PDS, on another community PDS, or one you host yourself), you can sign in to mu as an Atmosphere application using the standard ATProto OAuth flow. In this case, you are not creating a new account, and your account stays where it already lives. Parts 2 and 4 of these Terms cover your use of mu; your PDS provider's terms continue to govern the hosting of your account.

### 23. How moderation works on mu

Moderation on mu has two layers, plus the tools you have yourself. mu-layer moderation is driven by the mu Community Guidelines and applies to what mu users see; it is distinct from the legal-compliance-only PDS-layer moderation described in §21.1.

#### 23.1 At launch: labels published by Bluesky

At launch, the systematic moderation signal applied to content on mu comes from the labelling service operated by **Bluesky Social, PBC**. We ingest the labels Bluesky publishes through that service and apply them to content on mu. The signal includes automated detection of known illegal content (CSAM hashes, terrorism content, and similar), the Bluesky Trust &amp; Safety service's classifications, and other enforcement signals Bluesky distributes across the network.

We do not have a separate contract with Bluesky governing this. We rely on the labels Bluesky publishes openly, which we treat as a useful baseline. Bluesky has no access to mu's data and takes no responsibility for moderation on mu; mu's moderation is our responsibility.

By default, where a Bluesky label classifies or restricts content, mu applies the same classification.

#### 23.2 mu's own moderation layer (coming summer 2026)

We are a Dutch foundation and we take our own legal and editorial responsibility for what happens on mu. We do not intend to remain a passthrough for Bluesky's classifications.

We are building our own moderation layer, which we plan to introduce on mu in the near future. When it is live, it will let us:

- independently restrict, hide, label, or remove content or accounts on mu under the mu Community Guidelines, on signals we generate ourselves;
- decline to apply, or actively reverse, a Bluesky label on mu where we conclude the label does not serve our users or is not consistent with European norms;
- apply additional restrictions in specific Member States where local law requires them.

We will update these Terms when our own moderation layer goes live, and we will tell you through mu and through our public channels before it does.

Until our own layer is live, what we can do directly at the mu layer is more limited:

- we act on cases under the mu Community Guidelines where suspension is warranted;
- we apply Bluesky's labels as the systematic moderation signal on mu, because we do not yet have our own;
- we comply with binding legal orders.

#### 23.3 What we will always act on

Some categories are not subject to any reversal capability, before or after our own moderation layer is live. We act on the following whether or not Bluesky has labelled them:

- content that is illegal under EU law or the law of the relevant Member State, including child sexual abuse material, terrorism content, and content covered by binding takedown orders;
- valid copyright and trademark takedown notices;
- court orders and lawful orders from competent authorities.

We also act on these categories at the PDS layer (see §21.1) where the account is hosted on the Eurosky PDS.

#### 23.4 Proactive measures

At launch, the systematic proactive moderation signal on mu comes from Bluesky's labelling service. In addition, we do our own human review on a per-report basis under §25. Priority categories, where we act fastest, are: child sexual exploitation and abuse, terrorism content, content covered by a binding legal order, and credible threats to life or safety.

Once our own moderation layer is live, we will also use our own automated tools and our own human review to identify and act on prohibited content on mu, in addition to the Bluesky signals.

#### 23.5 Bluesky-label reviews happen on appeal

We apply Bluesky's labels automatically as the baseline. We do not pre-review each Bluesky label before it takes effect on mu. If you believe a Bluesky-derived label or restriction on Your Content is wrong, use the appeal route in §26 and we will review it.

While our own appview and moderation layer are being built, the action we can take on appeal is materially limited. Two things in particular:

- We can stop a specific account from signing in to mu where suspension is warranted, and we are in regular contact with Bluesky's Trust &amp; Safety team, to whom we can flag cases for review at the network level. We cannot ourselves override Bluesky's label at the network level until our own moderation layer is live.
- Suspension and content removal are different actions. Suspending an account from signing in to mu does not, by itself, remove that account's content from mu, because mu fetches content from across the AT Protocol network (see §6). To remove specific content from the mu view, we need to take a separate moderation action against that specific content. At launch we cannot yet take that separate action at the mu layer; the most we can do at the network level is flag the case back to Bluesky's Trust &amp; Safety team.

Once our own moderation layer is live, the full range of overrides described in §23.2 becomes available, and we will be able to apply specific actions to specific posts on mu.

#### 23.6 Moderation decisions are made in our editorial discretion

Moderation decisions on mu, including (once our own layer is live) decisions to apply, decline to apply, or reverse a label or restriction from Bluesky or another provider, are exercises of our editorial discretion as the operator of mu. We make them in good faith under these Terms, the mu Community Guidelines, and applicable law. We give reasons for our decisions and we offer the appeal routes set out in §26. Beyond those routes, and except where the law of your country says otherwise, our moderation decisions are not actionable in damages.

### 24. Recommender systems and feeds on mu

**At launch.** mu does not yet run its own appview, so it does not yet run its own recommender. The default feeds in mu and the personalisation signal they use are powered by Bluesky's appview (see §6), and the recommender behaviour mu displays at launch is the behaviour of Bluesky's recommender, surfaced through mu. You can choose alternative feeds, including third-party feeds operated by independent operators on the AT Protocol; those services are not run by us, and we are not responsible for the signals they use or for the content they surface. You can opt out of personalised recommendations entirely.

**When our own appview is live**, we will run our own default feeds and our own recommender. At that point, we will be specific in-product about which signals each of our own feeds uses; that information will also be summarised in the Statement of Reasons we publish under the Digital Services Act. We will update this section when the switch happens.

### 25. Reporting content or accounts on mu

You can report content or behaviour on mu that you believe breaks the mu Community Guidelines or the law, whether or not you are a mu user.

- From inside the mu app: use the report button on the post or profile.
- From anywhere: email [safety@mu.social](mailto:safety@mu.social). This channel is open to people who do not have a mu account, including people who are being impersonated, journalists, public-interest organisations, and members of the public.

For PDS-layer reports of illegal content, use [notices@eurosky.tech](mailto:notices@eurosky.tech) (see §21.2). The two channels are operated by the same Trust &amp; Safety team and feed into the same internal workflow; you do not need to send to both.

We will confirm receipt of your report. We will tell you the outcome, with reasons, when we have made a decision. If the law requires a specific format for the notice or for our response, we will follow it.

We also receive reports from law enforcement, regulatory authorities, trusted flaggers under Article 22 of the Digital Services Act, and other intermediaries on the AT Protocol. We treat these with appropriate priority.

### 26. If you disagree with a moderation decision on mu

If we restrict, hide, label, remove, or suspend Your Content or your mu access, you have the right to challenge that decision.

#### 26.1 Statement of reasons

When we take action against Your Content or your mu access, we will give you a clear explanation, in the format required by Article 17 of the Digital Services Act where it applies, covering:

- what we did;
- why we did it, including the specific Community Guideline, legal basis, or order we relied on;
- whether the decision was made by a human, by an automated system, or by a combination; and
- the routes available to challenge the decision.

#### 26.2 Internal appeal

You may appeal to us within six months of being notified of the decision, by replying to the notification or by emailing [appeals@mu.social](mailto:appeals@mu.social). Appeals are always reviewed by a person. We will decide your appeal and explain the outcome.

#### 26.3 Out-of-court dispute settlement

If you are in the EU or EEA, you have the right to take a dispute about our content-moderation decisions to a dispute settlement body certified under Article 21 of the Digital Services Act.

You can find certified bodies through your country's national Digital Services Coordinator or the European Commission's public list of Article 21 certified bodies. We will engage in good faith with any certified body that accepts the case. The dispute body's decision is not legally binding on either of us, but if we choose not to follow it we will publicly explain our reasoning.

#### 26.4 Courts

Nothing in this section affects your right to take a dispute to court. EU and EEA consumers can bring claims in the courts of their country of residence.

### 27. Composable moderation on mu

mu supports user-subscribed label services run by independent third parties on the Atmosphere. You can subscribe to additional label services that reflect the standards of communities you trust (for example, language-community moderators, topic-specific safety groups, or journalistic verification projects).

Third-party label services are not run by us. We do not endorse them; we do not vouch for the accuracy or fairness of their classifications. They will sit on top of mu's own moderation layer once that layer is introduced (see §23.2), never below: a third-party service can add restrictions for you, it cannot remove restrictions that mu has applied. Until then, third-party label services sit on top of the Bluesky baseline labels we apply on mu.

### 28. Ending your relationship with mu

The ways you end your relationship with mu depend on how your account is hosted.

#### 28.1 If your account is on the Eurosky PDS

You can:

- Revoke mu's authorization to act on behalf of your Eurosky account, from your Eurosky PDS account settings. Revoking the OAuth grant stops mu accessing your account immediately. Your Eurosky account remains active and you can continue to use it elsewhere on the AT Protocol or come back to mu later.
- Deactivate or delete your Eurosky account, under §21.3. Deletion ends both your Eurosky relationship and your mu relationship at the same time. Deactivation ends mu access for the duration of the deactivation; if you reactivate your account you may need to re-authorize mu.

#### 28.2 If your account is on a third-party PDS

The standard way to revoke mu's OAuth authorization is from your PDS provider's account settings. Where that surface exists, revoking there stops mu accessing your account immediately, and your account on the other PDS is unaffected.

In practice today, many PDS providers do not yet expose a settings screen for authorized applications. Support for this is being added to the AT Protocol reference implementation, and we expect it to become standard across providers over time. Until your provider exposes it, please email [support@mu.social](mailto:support@mu.social) and we will revoke our session for your account at our end. We treat that request the same way we would treat a revocation initiated from your PDS account settings.

#### 28.3 What happens on the mu side when you revoke

When you revoke mu's authorization:

- we stop processing new actions on your behalf from that moment;
- we delete the mu-side caches of identifiers and preferences associated with your account, on the timeline set out in our Privacy Policy;
- we retain only what we are required to keep under §6 (backups, abuse investigation, legal preservation).

#### 28.4 When we may end the relationship

We may suspend, restrict, or terminate your access to mu, independently of any action at the Eurosky PDS layer, if:

- you seriously or repeatedly break these Terms, the mu Community Guidelines, or the Copyright Policy;
- we are required to by court order or by another binding legal order;
- your continued access poses a credible risk to other users, to mu, or to third parties.

Where the law requires us to give you notice before suspending or terminating your mu access, and where doing so would not itself cause harm or breach a legal obligation, we will do so.

---

### Contact

For general questions:

- about mu: [support@mu.social](mailto:support@mu.social)
- about the Eurosky PDS or Portal: [support@eurosky.tech](mailto:support@eurosky.tech)

For trust and safety reports on mu: [safety@mu.social](mailto:safety@mu.social).

For appeals against moderation decisions on mu: [appeals@mu.social](mailto:appeals@mu.social).

For copyright and trademark notices: [ip@mu.social](mailto:ip@mu.social).

For Digital Services Act enquiries from members of the public, including DSA notices of illegal content submitted by recipients of the service: [dsa-support@eurosky.tech](mailto:dsa-support@eurosky.tech).

For DSA correspondence primarily for use by Member State authorities, the European Commission, the European Board for Digital Services, and trusted flaggers: [notices@eurosky.tech](mailto:notices@eurosky.tech).

For GDPR data protection enquiries (data controller is Stichting Modal): [privacy@eurosky.tech](mailto:privacy@eurosky.tech), and see the Privacy Policy for the contact details of our Data Protection Officer.

Postal: Stichting Modal, Kranenburgweg 135 A, 2583 ER The Hague, Netherlands.
