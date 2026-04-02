import type { CuratedStory } from './curatedStories';

// Agent Mode stories — 9-12th grade reading level, diverse academic topics with spy/thriller narrative frame
export const agentStories: CuratedStory[] = [
  // World 1: The Underground (stories 0-5) — Urban sociology, psychology, economics, journalism, civil liberties
  {
    title: "The Economics of Shadow Markets",
    description: "An intelligence briefing on underground economies",
    passage_text: "Every functioning economy operates on the principles of supply, demand, and scarcity — including illegal ones. The underground economy, sometimes called the shadow economy, encompasses all market transactions that occur outside government regulation and taxation. Economists estimate that shadow economies account for between eight and thirty percent of global GDP, depending on the region. These markets emerge when legal frameworks create artificial scarcity — prohibition of substances, excessive taxation, or bureaucratic barriers to legitimate commerce. Participants develop sophisticated substitute institutions: reputation systems replace consumer protection laws, violence substitutes for contract enforcement, and encrypted communication channels replace regulated banking. Understanding these parallel economic structures provides insight into fundamental market dynamics that textbooks often abstract away. The persistence of underground markets across every civilization in recorded history suggests they represent an inevitable response to economic friction rather than a problem with simple regulatory solutions.",
    grade_level: 10,
    category: "science",
    target_phonemes: ["kr", "sp", "st", "pr"],
    word_count: 145,
    reading_time_minutes: 3,
    difficulty_level: 10,
    cover_gradient: "from-slate-600 to-zinc-800"
  },
  {
    title: "Criminal Psychology",
    description: "Understanding the psychology behind criminal behavior",
    passage_text: "The question of why individuals commit crimes has occupied psychologists, sociologists, and philosophers for centuries. Early theories attributed criminal behavior to moral deficiency or biological determinism — the idea that some people are simply born predisposed to deviance. Modern criminology recognizes a far more complex interplay of factors. Social learning theory, developed by Albert Bandura, suggests that criminal behavior is acquired through observation and reinforcement within social networks. Strain theory, proposed by Robert Merton, argues that crime emerges when society promotes goals — wealth, status, success — but restricts legitimate pathways to achieving them for certain populations. Environmental factors including poverty, childhood trauma, peer influence, and community disorganization interact with individual psychological characteristics such as impulse control, empathy development, and cognitive distortion patterns. The most effective crime prevention strategies address these root causes rather than relying exclusively on punitive deterrence.",
    grade_level: 10,
    category: "science",
    target_phonemes: ["str", "pr", "bl", "gr"],
    word_count: 142,
    reading_time_minutes: 3,
    difficulty_level: 10,
    cover_gradient: "from-stone-600 to-neutral-800"
  },
  {
    title: "Investigative Journalism",
    description: "How reporters uncover hidden truths",
    passage_text: "Investigative journalism operates at the intersection of public interest and institutional accountability. Unlike daily news reporting, which covers events as they unfold, investigative journalism requires sustained, methodical research to expose information that powerful entities would prefer to keep hidden. The process begins with a hypothesis — a suspicion that official narratives diverge from reality — followed by systematic evidence gathering through public records requests, confidential source cultivation, and documentary analysis. The Pentagon Papers, Watergate, and the Panama Papers represent landmark investigations that reshaped public understanding of institutional behavior. Modern investigative reporters face unprecedented challenges: declining newsroom budgets reduce the resources available for long-term projects, digital surveillance makes source protection increasingly difficult, and coordinated disinformation campaigns attempt to undermine journalistic credibility. Despite these obstacles, investigative journalism remains essential to democratic governance, providing the transparency that enables informed citizen participation.",
    grade_level: 10,
    category: "history",
    target_phonemes: ["sh", "th", "pr", "tr"],
    word_count: 148,
    reading_time_minutes: 3,
    difficulty_level: 10,
    cover_gradient: "from-amber-700 to-yellow-900"
  },
  {
    title: "Civil Liberties Under Pressure",
    description: "The tension between security and freedom",
    passage_text: "Democratic societies perpetually navigate the tension between collective security and individual liberty. Following the September 11th attacks, the United States enacted the PATRIOT Act, dramatically expanding government surveillance capabilities. Supporters argued that national security necessitated monitoring communications to prevent future attacks. Critics contended that bulk data collection violated Fourth Amendment protections against unreasonable searches and represented precisely the kind of government overreach the Constitution was designed to prevent. This debate reflects a broader philosophical question: can a society that sacrifices fundamental freedoms in the name of security truly remain free? Benjamin Franklin's famous observation — that those who would give up essential liberty to purchase temporary safety deserve neither — encapsulates one perspective. The opposing view holds that rights become meaningless if citizens cannot survive to exercise them. Courts, legislatures, and citizens continue to negotiate this boundary, with each generation confronting new technologies that redefine what surveillance means and what privacy requires.",
    grade_level: 11,
    category: "history",
    target_phonemes: ["st", "pr", "kr", "bl"],
    word_count: 155,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-gray-600 to-slate-800"
  },
  {
    title: "Urban Sociology",
    description: "How cities shape human behavior and identity",
    passage_text: "Cities are laboratories of human interaction, concentrating diverse populations in shared physical space and generating social dynamics impossible in rural settings. Sociologist Georg Simmel argued that urban life produces a distinctive psychological orientation — the blasé attitude — as residents develop protective indifference to the overwhelming sensory stimulation of metropolitan environments. Jane Jacobs challenged urban planning orthodoxy by demonstrating that vibrant, safe neighborhoods emerge not from top-down design but from the organic complexity of mixed-use development, pedestrian traffic, and community surveillance she termed 'eyes on the street.' Contemporary urban sociology examines how physical infrastructure perpetuates inequality: highway placement that bisects minority neighborhoods, zoning laws that enforce economic segregation, and public transit systems designed to serve commuters rather than connect communities. Understanding these patterns reveals that cities are not neutral containers for human activity but actively constructed environments that shape opportunity, identity, and social connection.",
    grade_level: 11,
    category: "science",
    target_phonemes: ["br", "kr", "str", "pr"],
    word_count: 152,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-amber-600 to-orange-900"
  },
  {
    title: "The Broker's Network",
    description: "Intelligence report on The Broker's criminal empire",
    passage_text: "TARGET PROFILE — CODENAME: THE BROKER. Classification: Priority Alpha. The individual known as The Broker operates the largest underground intelligence marketplace in the eastern seaboard. Unlike traditional criminal enterprises that deal in physical contraband, The Broker trades exclusively in information — corporate secrets, government communications, diplomatic cables, and military logistics. The network employs a cellular structure where operatives rarely know more than two contacts, making infiltration extraordinarily difficult. Financial transactions utilize cryptocurrency laundering through a series of shell corporations registered in multiple jurisdictions. The Broker's personal identity remains unknown to all but the innermost circle. Psychological profiling suggests a highly intelligent individual with advanced education in economics and game theory, motivated by power rather than financial gain.",
    grade_level: 10,
    category: "adventure",
    target_phonemes: ["br", "kr", "str", "pr"],
    word_count: 132,
    reading_time_minutes: 2,
    difficulty_level: 10,
    cover_gradient: "from-amber-600 to-orange-900"
  },

  // World 2: Neon District (stories 6-11) — AI ethics, quantum computing, social media, digital privacy, neuroscience
  {
    title: "The Ethics of Artificial Intelligence",
    description: "Moral questions surrounding autonomous decision-making",
    passage_text: "When a self-driving vehicle encounters an unavoidable accident, how should its algorithm decide between protecting its passenger and minimizing harm to pedestrians? This variation of the trolley problem illustrates the profound ethical challenges embedded in artificial intelligence development. Unlike human decision-makers who rely on intuition, emotion, and contextual judgment, AI systems execute predetermined rules — someone must decide those rules in advance. The question of algorithmic bias reveals equally troubling dimensions: facial recognition systems trained predominantly on lighter-skinned faces demonstrate significantly higher error rates when identifying people of color. Hiring algorithms fed historical data perpetuate existing discrimination patterns by treating past prejudice as predictive signal. The European Union's AI Act represents the first comprehensive attempt to regulate artificial intelligence by risk category, but critics argue that regulation consistently lags behind technological capability. The fundamental question persists: who bears moral responsibility when an autonomous system causes harm — the developer, the deployer, or the algorithm itself?",
    grade_level: 11,
    category: "science",
    target_phonemes: ["kr", "pr", "str", "kw"],
    word_count: 160,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-cyan-500 to-blue-800"
  },
  {
    title: "Social Media and the Attention Economy",
    description: "How platforms engineer engagement and shape perception",
    passage_text: "Social media platforms are not communication tools — they are attention harvesting machines designed to maximize engagement time. Every feature, from infinite scrolling to notification badges to algorithmically curated feeds, reflects deliberate engineering choices optimized through A/B testing on billions of users. The business model is straightforward: platforms sell access to human attention to advertisers, creating economic incentives that fundamentally conflict with user wellbeing. Former platform designers have publicly acknowledged that features were designed to exploit dopamine-driven feedback loops — the same neurological mechanisms targeted by slot machines. The consequences extend beyond individual psychology: algorithmic amplification of emotionally provocative content distorts public discourse, filter bubbles reinforce existing beliefs while reducing exposure to contradicting perspectives, and the velocity of information sharing outpaces institutional capacity for verification. Media literacy in the digital age requires understanding not just what information is being consumed, but how the delivery mechanism itself shapes perception and behavior.",
    grade_level: 10,
    category: "science",
    target_phonemes: ["sh", "kr", "pr", "st"],
    word_count: 155,
    reading_time_minutes: 3,
    difficulty_level: 10,
    cover_gradient: "from-purple-600 to-indigo-800"
  },
  {
    title: "Quantum Computing Explained",
    description: "The revolutionary technology that could change everything",
    passage_text: "Classical computers process information using bits — binary units that exist in one of two states: zero or one. Quantum computers exploit the counterintuitive properties of quantum mechanics to process information using qubits, which can exist in multiple states simultaneously through a phenomenon called superposition. When qubits become entangled, measuring one instantaneously determines the state of another, regardless of physical distance — what Einstein famously dismissed as 'spooky action at a distance.' These properties enable quantum computers to evaluate enormous numbers of possibilities simultaneously rather than sequentially. For certain problem categories — drug molecule simulation, cryptographic analysis, logistics optimization — quantum computers promise exponential speedups over classical systems. Current quantum computers remain fragile, requiring temperatures near absolute zero to maintain coherence, and are susceptible to errors from environmental interference. The race between nations and corporations to achieve quantum supremacy carries profound implications for cybersecurity, as sufficiently powerful quantum computers could break the encryption protocols that currently protect global financial systems and government communications.",
    grade_level: 11,
    category: "science",
    target_phonemes: ["kr", "str", "pr", "tr"],
    word_count: 162,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-teal-600 to-cyan-800"
  },
  {
    title: "The Neuroscience of Decision-Making",
    description: "How the brain processes choices under pressure",
    passage_text: "Every decision you make involves a competition between two neural systems operating on fundamentally different principles. The prefrontal cortex — the brain's executive center — enables deliberate, rational analysis: weighing evidence, considering consequences, and planning long-term strategies. The amygdala, part of the limbic system, generates rapid emotional responses based on pattern recognition — threat detection, reward anticipation, and social evaluation. Under normal conditions, these systems collaborate effectively. Under stress, however, cortisol and adrenaline shift the balance toward the amygdala, producing faster but less nuanced responses. This explains why individuals make demonstrably worse decisions under pressure: the deliberative system is literally being suppressed by neurochemistry designed for physical survival, not complex analysis. Understanding this mechanism has practical implications: military training programs deliberately expose personnel to controlled stress to develop tolerance, and cognitive behavioral techniques can strengthen prefrontal regulation of emotional responses. The ability to maintain analytical thinking under pressure represents one of the most trainable cognitive skills.",
    grade_level: 11,
    category: "science",
    target_phonemes: ["pr", "str", "kr", "sk"],
    word_count: 158,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-blue-600 to-violet-800"
  },
  {
    title: "Digital Privacy in the Modern Age",
    description: "What your data reveals and who has access",
    passage_text: "Every digital interaction generates data — timestamps, geolocation coordinates, browsing histories, purchase records, biometric measurements, and communication metadata. Individually, these data points seem insignificant. Aggregated and analyzed through machine learning algorithms, they construct detailed psychological profiles capable of predicting behavior with unsettling accuracy. Research demonstrates that analysis of Facebook likes alone can predict personality traits more accurately than assessments by friends, family members, or romantic partners. Data brokers compile and sell these profiles to advertisers, employers, insurance companies, and government agencies, often without meaningful consent from the individuals being profiled. The distinction between surveillance and convenience has become increasingly blurred: the same smartphone that provides navigation, communication, and entertainment simultaneously functions as a tracking device that records movement patterns, social connections, and daily routines. Privacy advocates argue that meaningful consent requires understanding what data is collected, how it is used, and who benefits — conditions rarely met by current terms-of-service agreements.",
    grade_level: 11,
    category: "science",
    target_phonemes: ["kr", "str", "pr", "tr"],
    word_count: 160,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-slate-700 to-gray-900"
  },
  {
    title: "The Architect's Blueprint",
    description: "Intelligence dossier on The Architect's cyber empire",
    passage_text: "TARGET PROFILE — CODENAME: THE ARCHITECT. Classification: Priority Alpha. The Architect commands the Syndicate's entire digital infrastructure from the Neon District — a section of the city so saturated with surveillance technology that conventional counter-intelligence methods prove ineffective. Former systems engineer for a multinational defense contractor, The Architect leveraged proprietary knowledge of government communication systems to construct an impenetrable digital fortress. The network operates through a distributed architecture with no single point of failure; disabling individual nodes merely redirects traffic through alternative pathways. Intercepted communications suggest The Architect has developed an artificial intelligence capable of autonomous cyber-attacks — adapting strategies in real-time without human oversight. Recommended approach: physical infiltration of the central server facility, located beneath the district's primary telecommunications hub.",
    grade_level: 11,
    category: "adventure",
    target_phonemes: ["str", "kr", "pr", "sk"],
    word_count: 138,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-indigo-600 to-blue-900"
  },

  // World 3: The Embassy (stories 12-17) — Constitutional law, international relations, rhetoric, moral philosophy, revolutions
  {
    title: "Constitutional Interpretation",
    description: "How courts give meaning to founding documents",
    passage_text: "The United States Constitution, ratified in 1788, contains approximately 4,543 words — yet those words have generated over two centuries of continuous legal interpretation. The document's deliberately broad language — 'due process,' 'equal protection,' 'cruel and unusual punishment' — requires each generation to determine how eighteenth-century principles apply to contemporary circumstances the framers could never have anticipated. Originalists argue that constitutional provisions must be interpreted according to their meaning at the time of ratification, preserving democratic legitimacy by limiting judicial discretion. Living constitutionalists contend that the document was designed to evolve, that interpreting 'unreasonable searches' without reference to digital surveillance or 'free speech' without considering social media platforms produces outcomes the framers would find absurd. This debate extends beyond academic philosophy: Supreme Court decisions regarding privacy rights, gun regulation, executive authority, and criminal procedure depend fundamentally on which interpretive framework justices employ. The Constitution's genius — and its perpetual challenge — lies in establishing principles enduring enough to outlast the specific conditions of their creation.",
    grade_level: 11,
    category: "history",
    target_phonemes: ["pr", "kr", "str", "pl"],
    word_count: 165,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-amber-500 to-yellow-800"
  },
  {
    title: "The Art of Rhetoric",
    description: "How language persuades, manipulates, and inspires",
    passage_text: "Aristotle identified three modes of persuasion that remain foundational to communication theory: ethos, the speaker's credibility and character; pathos, the emotional response evoked in the audience; and logos, the logical structure of the argument itself. Effective rhetoric integrates all three, though the balance shifts according to context. Political campaigns emphasize ethos and pathos — voters respond to perceived trustworthiness and emotional resonance more readily than policy analysis. Scientific communication privileges logos — evidence, methodology, and reproducibility. Advertising operates almost exclusively through pathos, associating products with emotional states rather than rational evaluation. Understanding these mechanisms serves a dual purpose: it enables more effective communication and, perhaps more importantly, provides defense against manipulation. Propaganda and disinformation campaigns exploit the same rhetorical principles, using emotional appeals to bypass critical analysis and authority signals to suppress skepticism. Media literacy begins with recognizing which persuasive mode is being employed and evaluating whether the technique is appropriate to the claim being advanced.",
    grade_level: 11,
    category: "history",
    target_phonemes: ["kr", "str", "br", "pr"],
    word_count: 162,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-emerald-600 to-green-900"
  },
  {
    title: "Moral Philosophy: The Trolley Problem and Beyond",
    description: "Ethical frameworks for impossible choices",
    passage_text: "Imagine a runaway trolley hurtling toward five workers on the tracks. You stand beside a switch that could divert the trolley to a side track, where only one worker stands. Do you pull the switch? Most people say yes — saving five lives at the cost of one seems mathematically obvious. Now imagine you stand on a bridge above the tracks. The only way to stop the trolley is to push a large stranger off the bridge and onto the tracks below. The arithmetic is identical — one death to prevent five — yet most people recoil from this version. This inconsistency reveals the tension between consequentialist ethics, which evaluate actions by their outcomes, and deontological ethics, which hold that certain actions are inherently wrong regardless of consequences. Virtue ethics, a third major framework attributed to Aristotle, asks not 'what should I do?' but 'what kind of person should I be?' — shifting the focus from individual decisions to character development. These competing frameworks illuminate why reasonable people reach fundamentally different conclusions about contentious moral questions from capital punishment to economic redistribution.",
    grade_level: 11,
    category: "history",
    target_phonemes: ["str", "pr", "kr", "bl"],
    word_count: 170,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-orange-500 to-red-800"
  },
  {
    title: "Revolutions: Patterns of Political Upheaval",
    description: "What history reveals about how societies transform",
    passage_text: "Revolutions appear to erupt spontaneously, but historians identify recurring preconditions that make societies vulnerable to radical transformation. Crane Brinton's comparative analysis of the English, American, French, and Russian revolutions identified a consistent pattern: a prosperous society experiences relative economic decline; intellectuals withdraw support from the existing regime; the government fails to address legitimate grievances; and a triggering event catalyzes latent discontent into collective action. The revolution itself typically progresses through stages — initial moderate reform gives way to radical intensification as extremist factions outmaneuver moderates, followed by a period of reaction and consolidation, often under authoritarian leadership that preserves some revolutionary changes while abandoning others. The Arab Spring of 2011 demonstrated both the pattern's persistence and its limitations: social media accelerated mobilization but could not substitute for organizational infrastructure capable of governing after existing regimes collapsed. Understanding revolutionary dynamics remains essential for both preventing unnecessary violence and recognizing when institutional reform has become genuinely impossible.",
    grade_level: 12,
    category: "history",
    target_phonemes: ["str", "pr", "kr", "bl"],
    word_count: 165,
    reading_time_minutes: 3,
    difficulty_level: 12,
    cover_gradient: "from-red-600 to-rose-900"
  },
  {
    title: "International Relations Theory",
    description: "Understanding power dynamics between nations",
    passage_text: "International relations scholars have developed competing theoretical frameworks to explain why nations behave as they do. Realism, the dominant paradigm since Thucydides, posits that states are rational actors operating in an anarchic system where survival requires the accumulation and projection of power. Liberalism challenges this pessimistic view, arguing that institutions, trade interdependence, and democratic governance create cooperative incentives that can mitigate conflict. Constructivism shifts focus entirely, suggesting that international behavior is shaped not by material power or institutional structures but by shared ideas, norms, and identities — nations act according to their conception of who they are, not merely what they have. Each framework illuminates different aspects of international behavior while remaining blind to others. The rise of China as a global power, for example, appears threatening through a realist lens, manageable through a liberal institutional framework, and contingent on identity formation through a constructivist perspective. Sophisticated analysis requires facility with multiple frameworks rather than rigid adherence to any single theory.",
    grade_level: 12,
    category: "history",
    target_phonemes: ["kr", "str", "pr", "bl"],
    word_count: 165,
    reading_time_minutes: 3,
    difficulty_level: 12,
    cover_gradient: "from-sky-600 to-blue-900"
  },
  {
    title: "The Double Agent Exposed",
    description: "Intelligence report on The Double Agent's betrayal",
    passage_text: "TARGET PROFILE — CODENAME: THE DOUBLE AGENT. Classification: Priority Omega. For the past seven years, an individual operating under deep cover within our own intelligence apparatus has been funneling classified material to the Syndicate. Analysis of compromised operations reveals a pattern consistent with someone possessing Level 4 security clearance and access to the Central Intelligence Database. The mole has demonstrated extraordinary patience and discipline, only transmitting intelligence that would not immediately reveal their position within the organization. Behavioral analysis of personnel with matching access profiles has narrowed the suspect pool to fourteen individuals. The Double Agent likely maintains a sophisticated compartmentalization system — separating their operational and personal identities through rigorous psychological discipline. Approach with extreme caution: this individual has survived internal reviews for seven years and will not be easily deceived.",
    grade_level: 11,
    category: "adventure",
    target_phonemes: ["kr", "str", "pr", "bl"],
    word_count: 145,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-yellow-600 to-amber-900"
  },

  // World 4: Syndicate HQ (stories 18-23) — Game theory, leadership psychology, whistleblower ethics, media literacy, statistics
  {
    title: "Game Theory and Strategic Thinking",
    description: "The mathematics of competition and cooperation",
    passage_text: "Game theory — the mathematical study of strategic interaction — provides frameworks for analyzing situations where the outcome of your decision depends on the decisions of others. The Prisoner's Dilemma, perhaps the most famous game-theoretic model, demonstrates why rational individuals might fail to cooperate even when mutual cooperation produces the best collective outcome. Two suspects, interrogated separately, each face a choice: cooperate with the other suspect by remaining silent, or defect by betraying them. If both cooperate, both receive light sentences. If both defect, both receive moderate sentences. But if one defects while the other cooperates, the defector goes free while the cooperator receives the harshest penalty. Rational self-interest drives both toward defection, producing a collectively suboptimal result. This model illuminates phenomena ranging from arms races to climate change negotiations to market competition. The key insight: systems designed to encourage cooperation must alter the incentive structure rather than merely appealing to participants' better nature. Repeated interactions, reputation systems, and enforceable agreements transform the strategic calculus.",
    grade_level: 11,
    category: "science",
    target_phonemes: ["str", "kr", "pr", "bl"],
    word_count: 168,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-red-700 to-rose-900"
  },
  {
    title: "The Psychology of Leadership",
    description: "What distinguishes effective leaders from authoritarian ones",
    passage_text: "Leadership research has evolved from the 'great man' theory — the belief that leaders possess innate, extraordinary qualities — toward more nuanced models that emphasize context, behavior, and relational dynamics. Transformational leadership, identified by James MacGregor Burns, inspires followers to transcend self-interest for collective goals through intellectual stimulation, individualized consideration, and articulation of a compelling vision. Authoritarian leadership achieves compliance through coercion, surveillance, and punishment — effective for short-term control but corrosive to organizational capacity for innovation and adaptation. Research on psychological safety, pioneered by Amy Edmondson at Harvard Business School, demonstrates that teams perform best when members feel safe to take risks, admit mistakes, and challenge prevailing assumptions without fear of retribution. The most dangerous leadership pathology is not incompetence but the combination of charisma and moral disengagement — leaders who inspire genuine devotion while pursuing destructive objectives. Understanding these dynamics enables both the development of effective leadership practices and recognition of manipulative ones.",
    grade_level: 12,
    category: "science",
    target_phonemes: ["pr", "str", "kr", "bl"],
    word_count: 162,
    reading_time_minutes: 3,
    difficulty_level: 12,
    cover_gradient: "from-violet-700 to-purple-900"
  },
  {
    title: "Whistleblower Ethics",
    description: "When loyalty to truth conflicts with institutional obligation",
    passage_text: "Whistleblowing — the act of exposing wrongdoing within an organization to parties capable of effecting change — occupies one of ethics' most contested territories. The whistleblower simultaneously violates obligations of loyalty, confidentiality, and institutional trust while fulfilling obligations to truth, public welfare, and personal conscience. Daniel Ellsberg's release of the Pentagon Papers revealed systematic government deception about the Vietnam War. Edward Snowden's disclosure of mass surveillance programs exposed constitutional violations by intelligence agencies. Chelsea Manning's transmission of classified military documents documented civilian casualties. Each case generated fierce debate: were these individuals principled truth-tellers serving democratic accountability, or reckless violators of legitimate secrecy whose actions endangered national security? Legal protections for whistleblowers remain inconsistent — federal law provides remedies for some categories of disclosure while criminalizing others, creating uncertainty about whether any given act of conscience will result in protection or prosecution. The ethical evaluation ultimately depends on whether one prioritizes institutional stability or individual moral responsibility.",
    grade_level: 12,
    category: "history",
    target_phonemes: ["kr", "str", "pr", "tr"],
    word_count: 163,
    reading_time_minutes: 3,
    difficulty_level: 12,
    cover_gradient: "from-slate-600 to-gray-900"
  },
  {
    title: "Statistical Reasoning and Misinformation",
    description: "How numbers deceive when context is removed",
    passage_text: "Statistics do not lie, but they can be presented in ways that systematically mislead. Consider a pharmaceutical company reporting that its new drug reduces heart attack risk by fifty percent. This sounds dramatic until you learn the baseline: risk dropped from two in ten thousand to one in ten thousand. The relative reduction is indeed fifty percent, but the absolute reduction is one in ten thousand — a distinction with profound implications for whether the drug merits its cost and side effects. Simpson's Paradox demonstrates an even more counterintuitive phenomenon: a trend that appears in separate groups of data can reverse when the groups are combined. A university might demonstrate that each department admits women at higher rates than men, yet the overall institutional admission rate for women is lower — because women disproportionately apply to more competitive departments. Understanding base rates, selection bias, confounding variables, and the distinction between correlation and causation represents essential cognitive armor against manipulation. In an information environment saturated with competing statistical claims, the ability to evaluate methodology matters more than the ability to recall conclusions.",
    grade_level: 11,
    category: "science",
    target_phonemes: ["str", "kr", "pr", "bl"],
    word_count: 175,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-rose-700 to-red-900"
  },
  {
    title: "Media Literacy in the Disinformation Age",
    description: "Evaluating information in a post-truth landscape",
    passage_text: "The term 'fake news' has become so politically weaponized that it now obscures more than it reveals. A more useful framework distinguishes between misinformation — false content shared without malicious intent — and disinformation — deliberately fabricated content designed to deceive. Both exploit cognitive biases that evolution optimized for survival rather than accuracy: confirmation bias leads us to accept information that reinforces existing beliefs while scrutinizing contradicting evidence; the availability heuristic causes us to overestimate the frequency of vivid, emotionally charged events; and social proof encourages us to adopt beliefs that appear popular within our reference groups. Effective media literacy extends beyond simple fact-checking to encompass source evaluation, methodology assessment, and recognition of emotional manipulation techniques. The SIFT method — Stop, Investigate the source, Find better coverage, Trace claims to their origin — provides a practical framework for evaluating information encountered online. Perhaps most importantly, media literacy requires intellectual humility: the recognition that our own perception is vulnerable to the same biases we identify in others.",
    grade_level: 12,
    category: "science",
    target_phonemes: ["str", "pr", "kr", "th"],
    word_count: 170,
    reading_time_minutes: 3,
    difficulty_level: 12,
    cover_gradient: "from-zinc-600 to-stone-800"
  },
  {
    title: "The Final Briefing",
    description: "Mission parameters for the assault on Syndicate HQ",
    passage_text: "OPERATION BLACKOUT — FINAL MISSION BRIEFING. Classification: Eyes Only. The Syndicate's headquarters occupies the top fifteen floors of the Meridian Tower — a commercial skyscraper in the financial district. Satellite imagery and intercepted communications indicate the facility houses approximately two hundred personnel, including a dedicated security force equipped with military-grade weaponry. The Director maintains a command center on the penthouse level, protected by biometric locks, electromagnetic shielding, and a personal detail of twelve former special operations soldiers. Your primary objective: reach the penthouse, secure the Director, and extract the Syndicate's complete operational database from the central server. Secondary objective: neutralize the facility's communication array to prevent the activation of contingency protocols that would alert Syndicate cells worldwide. Mission window: four hours from initial breach. The intelligence you've gathered across every operation — economics, psychology, technology, diplomacy — converges here. Everything you've learned has prepared you for this moment.",
    grade_level: 11,
    category: "adventure",
    target_phonemes: ["str", "kr", "pr", "bl"],
    word_count: 155,
    reading_time_minutes: 3,
    difficulty_level: 11,
    cover_gradient: "from-red-600 to-red-950"
  },
  {
    title: "The Director Unmasked",
    description: "Final intelligence dossier on The Director",
    passage_text: "TARGET PROFILE — CODENAME: THE DIRECTOR. Classification: Priority Omega Supreme. The Director — identity confirmed as former Deputy Director of National Intelligence Marcus Webb — orchestrated the Syndicate's creation following his forced retirement amid allegations of unauthorized surveillance programs. Leveraging two decades of intelligence community contacts and intimate knowledge of global security architectures, Webb constructed an organization that operates as a shadow intelligence service, selling capabilities to the highest bidder regardless of ideological alignment. Psychological assessment indicates a narcissistic personality structure driven by a perceived betrayal by the system he served. Webb possesses encyclopedic knowledge of intelligence tradecraft, maintains personal relationships with senior officials across multiple governments, and has demonstrated willingness to employ extreme measures to preserve operational security. He represents the most dangerous adversary this agency has confronted. Approach assumes maximum threat posture.",
    grade_level: 12,
    category: "adventure",
    target_phonemes: ["str", "kr", "pr", "sk"],
    word_count: 147,
    reading_time_minutes: 3,
    difficulty_level: 12,
    cover_gradient: "from-red-800 to-red-950"
  },
];
