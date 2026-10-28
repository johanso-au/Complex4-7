# Complex 4-7 — Game Design Document

2026-10-28 · Jordan

> Converted from the online design doc on 2026-10-29. Diagrams are not reproduced here; placeholders mark where they sit.

## Pitch & pillars

**Complex 4-7** is a document-and-dials thriller: you are the commander of a Titan II launch crew, deep underground in 1979–80, and every shift you must decide what is real — the orders, the alarms, the people at the blast door, and the machine itself.

Title: *Complex 4-7*, after the fictional launch complex where the game is set.

**Tone.** Fluorescent dread: humming, procedural, intimate, fallible. See *Vibe* below.

### Design pillars

1. **Verification is the verb.** Like *Papers, Please*, play is cross-checking: an order against the code book, a badge against the access list, a gauge against the tech order. Every mechanic resolves into "does this match?"
2. **The machine is a character.** The missile leaks, corrodes, drifts out of tolerance and lies through faulty sensors. Readiness is something you nurse, not a status you have.
3. **Procedure versus judgement.** The checklist is usually right. Sometimes it's not. The game's best moments come when following the book and doing the right thing diverge.
4. **Small room, big world.** You never see the surface. The Cold War arrives as teletype paper, phone calls and the tone of your deputy's voice.
5. **Consequences ripple.** Mistakes are logged, reviewed and remembered — by the Air Force, by your crew and by the story.

### Inspirations

- *Command and Control* (Eric Schlosser) — the 1980 Damascus, Arkansas accident, the culture of SAC, near misses.
- *Papers, Please* — desk-based verification, moral squeeze, family-at-home pressure.
- *Iron Lung*, *Signalis*, *Return of the Obra Dinn* — confined spaces, limited palettes, deduction.
- *Threads*, *WarGames*, *Fail Safe* — the period's anxiety about automation and miscommunication.

## Vibe

**Complex 4-7 feels like the night shift at the end of the world: fluorescent, humming, procedural — and quietly, constantly one mistake away.** The bomb is never the monster. The monster is fatigue, paperwork, a cracked seal and an institution that would rather stay on alert than admit something is wrong.

### The vibe in five words

- **Humming** — the room is never silent; silence means something has stopped.
- **Procedural** — comfort comes from the checklist, and so does danger.
- **Intimate** — four people, one room, 24 hours. You know how Pruitt takes his coffee.
- **Fallible** — every instrument, document and person can be wrong, including you.
- **Small** — one complex, one missile, one crew. The world is only ever a rumour on the teletype.

### Touchstones

- *Command and Control* — the accident as a slow chain of ordinary decisions.
- *Chernobyl* (HBO, 2019) — institutional denial, gauges that "only read 3.6".
- *Alien* (1979) — worn industrial interiors, blue-collar crew, the machine that doesn't care.
- *Papers, Please* — the desk as a moral pressure cooker.
- *Threads* — what's at stake, never shown, always implied.

### Do / don't

| Do | Don't |
|---|---|
| Let quiet stretches breathe; reward attention in them | Fill every second with alarms |
| Show the world through paper, voices and lamps | Cut to outside the capsule, ever |
| Make the crew funny, tired and human | Make anyone a cartoon villain or a hero |
| Treat launch as a loss, whatever the reason | Celebrate launch, score it or show the target |
| Use period-correct objects and language | Wink at the player with modern references |

## Setting & story

The game spans a flexible number of shifts (roughly 12–20) from autumn 1979 to late 1980 — a real window of rising tension (Afghanistan, the NORAD false alarms of 1979–80, Damascus) — at a fictional site, **Launch Complex 4-7**, in an unnamed southern state.

Using a fictional complex and fictional people gives freedom to dramatise without misrepresenting real crews. Real events can be echoed in the news ticker and in thinly veiled incidents.

### The site

- **Launch control centre (LCC):** three levels inside a hardened dome. You live on level 2, at the console.
- **Access portal and blast doors:** two sets of doors with a vestibule; the entry-control point where you verify people.
- **Cableway:** the tunnel linking the LCC to the silo.
- **Silo:** nine levels around the missile. You never go there; you send people and read what comes back.

### The crew (four per shift)

| Role | Character | Function in play |
|---|---|---|
| Missile Combat Crew Commander | You | Final authority, holds a launch key |
| Deputy Commander | Lt. Dana Whitlock | Second key; can agree, hesitate or refuse |
| Ballistic Missile Analyst Technician | SSgt. Ray Ortiz | Reads the missile; sends you diagnoses |
| Missile Facilities Technician | A1C Lyle Pruitt | Young, sharp, exhausted; hands-on in the silo |

Visitors rotate in: maintenance teams (PTS crews), the wing safety officer, inspectors, a chaplain, a suspicious "new" tech.

### Arc in three acts

1. **Routine (shifts 1–6).** Learn the console, the binder and the door. Small faults, drills, a nervous new deputy. A drill order arrives that is subtly wrong; catching it teaches the core skill.
2. **Pressure (shifts 7–14).** World tension climbs. Real-looking alert messages, a NORAD false-warning night, a fuel-vapour leak the base wants hushed up, an inspector who might be testing your loyalty. Maintenance gets deferred to stay on alert.
3. **Crisis (shifts 15–20).** A dropped tool, a pierced fuel tank, a slowly building disaster — while a genuine-looking launch order sits authenticated on the printer. Which crisis is real?

### Between shifts

There is no off-duty or home life. Between shifts the player sees only the job: the debrief, their Standing, and the next shift's work order board. The world outside reaches them only through the teletype.

### Endings

**Most runs end in one of three ways: you're relieved of duty, the missile is lost, or you reach the final chapter and face a real order.** Early endings return the player to the start of that shift; the final chapter's endings are the game's close.

#### Early endings

| Ending | Trigger | What the player sees | When |
|---|---|---|---|
| Relieved of duty | Third strike; a second failed readiness test; or breaching site security, such as sending crew off-site (instant) | A typed letter of relief at changeover. The relief crew takes your chair; you're escorted out through the door you've guarded all game | Any shift |
| Damascus (fuel leak and fire) | Tank rupture from nitrogen in the socket beat; an uncontained leak; vapour ignition from the fan chain; a fire suppression fails to stop | The klaxon, then a playable evacuation. The ending report lists who walked out | Acts 2–3 |
| Compromised | An infiltrator is admitted and not caught before changeover: the safe log shows an unexplained opening and authenticator material is missing | The complex is taken off alert, every code declared compromised, the crew investigated. The ending is the investigation report, naming the moment you admitted him | Act 3 |
| Silence | The level 7 beat with three levers failed | Another crew's teletype, somewhere else, reports on Complex 4-7 | Act 3, rare |

If an admitted infiltrator heads for the missile rather than the safe, the Level 7 beat plays instead of Compromised.

#### Final chapter endings

| Ending | Trigger | What the player sees |
|---|---|---|
| Launch | Keys turned on the real code | Silence, the damage printout, the last order, the closing ritual |
| Refusal | The crew refuses | Silence, the stand-down order, the same ritual, no printout |
| Window missed | Indecision or a procedural failure lets the window pass | As Refusal, but the debrief records a failure to execute, not a choice |

#### Recorded, not endings

- **Failing a readiness test** (refusing or botching an assessment launch): a strike and a reliability review. Option C refusal goes to an inquiry instead. A second failed test ends the run as Relieved of duty.
- **Key turned** on the Act 3 misrouted order: recorded in the debrief and named in the epilogue.

**Epilogue.** Final Readiness and Integrity set one closing line on the player's career (*steady hand*, *commendation*, *clean hands* or *burnout*), and per-person trust decides which crew members the epilogue mentions and how.

## Narrative structure

**The story is a fixed spine with variable consequences: the same key beats happen in every run, but what you noticed, reported and deferred decides how bad each beat is, who is there for it, and how it ends.** It's a braid, not a tree — the *Papers, Please* model, sharpened so attention to detail feeds the plot.

### Three layers of content

1. **Spine beats — authored, always happen.** World events on the teletype, the first exercise order, the NORAD false-alarm night, the leak the wing wants buried, the dropped socket, the final order. Dates and order are fixed, so the story always has shape.
2. **Seeded events — authored, conditional.** Story scenes that only trigger from your state: Pruitt confides his drinking only if his trust in you is high; an inspector arrives only if you've deferred too much; a crewmate gets transferred only if you reported them.
3. **Procedural traffic — generated, rule-bound.** Routine messages, minor faults, work orders and most visitors are drawn from pools each shift, using only the rules taught so far. Replays differ in detail; difficulty scales by act.

### Hidden state

Choices write to a small set of values. Only Standing is shown; the rest are never displayed as meters, and the player reads them through people's behaviour and the debrief paperwork.

| Value | Shown? | Rises when you… | Falls when you… | Used for |
|---|---|---|---|---|
| Readiness | Hidden | Keep the site on alert; defer faults; hit timings | Report faults; take the site off alert | Inspector visits; epilogue |
| Integrity | Hidden | Log honestly; report faults; refuse unlawful orders | Make false confirmations; fudge logs; sign off work not done | Option C aftermath; epilogue |
| Trust, per person (Whitlock, Ortiz, Pruitt, Haskins) | Hidden | Back them; send them in safely; follow through | Overrule, endanger or report them | Story triggers only (see Crew and the deputy) |
| Standing | Shown at debrief | Commendations | Strikes | Three strikes = relieved of duty |

### The core trick: planted faults

Some "random" faults are not random. A slightly low oxidiser reading in shift 4 looks like routine traffic, but it is a story seed. If you catch it and report it, the tank gets serviced and the Act 3 leak is smaller. If you miss it or defer it, it returns worse. The debrief after the incident traces the chain back to the moment you could have caught it.

This is how attention to detail and the moral dilemma become one mechanic: noticing is the first choice, reporting is the second, and the story remembers both.

### Spine beat: "The new guy" (shift 8)

**A trusted maintenance tech arrives with a partner you've never seen, and the paperwork doesn't quite match. Every answer costs something, except the one you can only reach by paying attention earlier.**

**Setup.** Earl Haskins, a veteran maintenance tech the player has admitted in three earlier shifts, buzzes at the door for a scheduled job on silo level 7. With him is Danny Voss, a nervous young airman. Voss's badge is current, but he isn't on today's dispatch sheet, and his badge number differs by one transposed digit from a name on the access list. Haskins vouches for him: "Kid transferred in Tuesday. Paperwork's always behind."

**The hidden key.** An amended dispatch sheet printed on the teletype about two hours earlier, buried among routine traffic. It adds Voss and corrects the number. Players who read and filed their traffic can match it and admit him by the book.

**The crew is split.** Whitlock is a stickler: rules exist because people die without them. Pruitt and Haskins are pragmatists: the job has to get done. Whatever you choose, someone thinks less of you, so the beat changes the crew's internal politics rather than just a meter.

| Choice | Immediate | Later consequence |
|---|---|---|
| Find the amended dispatch, admit | Job done properly; Whitlock notes you checked | None; trust up across the crew. The best outcome, only reachable through earlier attention |
| Call maintenance control to verify | Line busy; 3–4 minutes lost while other events stack up; partial confirmation | Admit or deny with more information, at a time cost |
| Admit on Haskins's word | Job done properly | Whitlock's trust drops sharply; a violation sits in the log for any later inspector to find. Pruitt's trust rises |
| Deny, by the rules | Whitlock's trust rises; Haskins is annoyed | Two-person rule means Pruitt has to partner Haskins, abandoning his own checklist. Rushing, he leaves a level 7 exhaust fan off |

*[Diagram in the online design doc: the new guy · 4 choices, 1 fatal chain]*

Phone verification feeds into admit or deny with better information; only the deny path can end the game, and only if the gauge goes unread.

**The fan chain (deny path).** The fan being off is visible: the panel's level 7 airflow gauge reads low, a ventilation lamp shows amber, and Pruitt's job card has no fan restart signed. Catch it any time in the next shift and you send someone to restart it. Miss it, and vapour accumulates until a relay sparks during the shift 9 power transfer. The silo is lost: game over, with the option to restart shift 8. The debrief shows the gauge reading at every point you could have looked.

**Design notes.**

- The rule-follower is never automatically right, and nor is the rule-breaker. Attention is the only consistently good answer, which is the game's thesis.
- **A rhyme in Act 3.** A near-identical setup returns with a different visitor, and this time the discrepancy is a security evaluation test. Players who learned "always trust the vouching tech" get caught out, so the lesson can't be reduced to a rule.
- Whitlock's stickler stance can soften if she has seen procedure hurt someone earlier in the run; the beat reads her current disposition, not a fixed one.

### Spine beat: "Pressure" (the socket, Act 3)

**The game spends two acts teaching you that low fuel pressure is fixed with nitrogen, then makes that habit the thing that destroys the missile.** The fix was always conditional; the checklist said so. The trap is your own competence.

This is a dramatisation for the game, not a claim about what happened at Damascus. The nitrogen system and its limits are invented and kept abstract.

#### Planting the habit (Acts 1–2)

- **Shift 2:** fuel tank pressure creeps slowly below its band. The tech-order page says: confirm no vapour alarm and no maintenance on the tank, then top up with nitrogen from the facility panel. The player does it; the needle recovers. Small commendation.
- **Shifts 4–12:** the slow creep recurs 3–4 times as routine traffic. Each time, the confirmation steps feel like paperwork. Players start skipping straight to the valve.
- The tech order never changes. The condition is printed on the page every time.

#### The beat

A maintenance team is working on the missile at silo level 4. A socket slips, falls and punctures the stage 1 fuel tank. **The player is not told.** The team on the level is frightened of what they've done, and how long they take to say so depends on how much they trust you.

| Time after drop | What the player can see or hear |
|---|---|
| 0:00 | A dull clang on the radio channel, then two seconds of silence. Easy to miss |
| 0:20 | Fuel pressure starts falling, visibly faster than the familiar slow creep |
| 0:45 | Level 4 vapour detector lamp goes amber |
| 0:45 / 2:00 / 4:00+ | The team reports the dropped socket: high / medium / low crew trust |
| Any time | Radio the level and ask what's happening; they confess immediately |

The low-pressure lamp also comes on, with the same sound as every routine top-up.

#### What happens next

- **Reach for the nitrogen:** the valve can be opened before any report arrives. Pressurising a punctured tank turns a leak into a rupture. The fuel tank fails completely, and the game moves straight into the *Damascus* ending sequence: evacuation of the complex, where how many of your crew walk out depends on how fast you clear the levels.
- **Stop and check:** noticing the fall rate, the vapour lamp, or simply radioing the level reveals the puncture. The player runs the leak checklist instead: clear the silo, ventilate, call command post. The incident still escalates (it's a spine beat), but a contained leak ends with the tank drained, the site off alert for weeks of repairs, and the complex back on alert in time for the final chapter.

#### Why it works

- **It's fair.** Three independent clues precede the report, and the checklist condition was printed every time.
- **It punishes habit, not ignorance.** Only players who skipped the confirmation steps fall in.
- **Trust becomes information.** Crew who trust you report faster. Earlier choices about how you treat people literally decide how long you're flying blind.
- **The debrief replays it.** The clang, the fall rate and the lamp, each with a timestamp, against the moment you opened the valve.

### Conditional beat: "The man on level 7" (Act 3)

**If the player lets trust collapse or security slip, someone ends up alone with the warhead, trying to arm it.** It is the one beat where the bomb itself becomes the threat, so it has to be earned by the player's own failures and stay rare.

Warhead arming is entirely invented and abstract: a status panel with four stage lamps and a safing procedure. Nothing reflects real weapon design.

#### Two variants, one beat

| Variant | Trigger | Who it is |
|---|---|---|
| **Breaking point** | A crew member's trust stays at the floor (bottom 15%) for 2 consecutive shifts, plus at least one stressor: a citation against them, a family crisis letter, or being blamed in a debrief | Usually Pruitt. Exhausted, cornered, convinced the institution is going to bury him. Not a villain; someone the player helped break |
| **Infiltrator** | The Act 3 security-test rhyme, in a run where the player has admitted two or more unverified visitors. The "evaluator" is real this time | A stranger with good paperwork. No backstory, no talking down |

**Warning signs (breaking point).** It must never come from nowhere: missed log entries, short answers on the radio, a letter from his wife left on the desk, Whitlock saying "something's off with Lyle." The player can prevent it by rebuilding trust in quiet hours, or by reporting him under the reliability programme, which removes him from duty (an integrity win that costs the crew its best technician).

#### The beat

The warhead status panel on the indicator view lights its first stage lamp. Each stage takes about 45 seconds; four stages complete arming. The player has these levers, each with a cost:

| Lever | Effect | Cost |
|---|---|---|
| **Talk him down** (breaking point only) | Radio dialogue using what you actually know about him: his kid, his coffee, the thing he told you on night watch. Each right answer pauses progress | Wrong or generic answers speed him up |
| **Second tech on the level** | Two-person rule: his partner can intervene, if *their* trust in you is high enough to act on your order | If trust is low, they freeze or leave |
| **Safing procedure** | A sealed safing card from the two-person safe reverses a stage per correct entry | Needs Whitlock's half of the combination; her trust decides how fast she moves |
| **Isolate silo power** | Halts progress while power is out | Kills ventilation (the fan chain returns), takes the site off alert, and can strand people on the level |
| **Security response** | Armed team from topside arrives in about 3 minutes | Breaking point: likely ends with him shot. Infiltrator: the only way to remove him |

#### Outcomes

- **Talked down:** he walks out, is relieved of duty and taken away. The best outcome, only for players who invested in him.
- **Safed:** the warhead is safed; he or the infiltrator is detained or killed. Crew shaken, trust shifts depending on how it was done.
- **Site lost:** isolated power plus the vapour chain destroys the missile without a nuclear yield. Routes to the *Damascus* ending.
- **Silence:** all four lamps light. A new override ending (below): the game cuts to a different launch crew elsewhere, reading a terse teletype about Complex 4-7. Nothing is shown.

Silence should be very hard to reach: it needs the player to fail on at least three levers at once. Most players will never see it, and the fact that it exists should hang over every Act 3 shift.

#### Tone guardrails

- Don't use "going postal": the phrase is from the 1990s and the trope reads as a cheap shock.
- Frame the breaking point as the product of the system and the player's choices, not as a sudden madman. It should feel like a tragedy the player co-wrote.
- No combat or gore. The violence is heard on the radio and read in the debrief.

### Fantasy rule: assessment codes

**The crew always holds real launch authority: a valid code and two keys launch the missile, and nobody can stop it. But SAC can issue training and assessment codes that authenticate and behave exactly like real ones, which the launch computer recognises and quietly declines to fire.** The player can never tell the two apart, so every valid order must be treated as real. Until the final chapter, every code is an assessment code.

This is fiction, not a claim about real command-and-control systems. It is set at SAC, not CENTCOM, which wasn't created until 1983 and never held nuclear forces.

- **Reveal pacing.** Until Act 2, every completed key turn is followed by silence and a terminate message, and the player doesn't know why nothing happened. An Act 2 debrief explains it in one line: "Assessment authenticator recognised by launch computer. Readiness test complete." A tech-order page on the assessment-code system is then added to the binder.
- **Why it stays frightening.** The player now knows tests exist but has no way to identify one in advance. The assessment flag is invisible to the crew by design. Each key turn is still a real decision.
- **No outside hand.** There is no remote lock or override anywhere in the game. If the code is real, the keys are final. The responsibility is entirely the crew's.
- **It sharpens Key turned.** In Act 3 the misrouted order is an assessment code; the debrief records only that you turned your key on it.

### Comms gravitas

**How serious a message sounds must never predict whether it's real.** Some assessments come dressed as the end of the world, so the player can't use tone as a tell, and the real order in the final chapter gets no special dressing of its own.

Messages come in three levels of dressing:

| Level | What the player sees and hears |
|---|---|
| Routine | Terse header, standard format, the bells. Most assessments |
| Elevated | A DEFCON change prints first and appears in the top bar. A phone call from command post, voice strained. Longer preamble |
| Maximum | All of the above, plus language stating release has been authorised by the National Command Authority (the President), with presidential authentication cited. The bells, then a pause, then the bells again |

- One **maximum-level assessment** in Act 2 is designed to make the player think "this time it's serious". It isn't. The debrief afterwards is as flat as any other.
- **DEFCON in the top bar.** DEFCON 5 is normal peacetime readiness; numbers fall toward DEFCON 1 as danger rises. A change of even one level is rare and should feel like the floor moving.
- **Presidential authentication** is referenced only as words in a message, never as a code the player handles. All codes the player handles are the crew's own invented authenticators.

### Conditional beat: "Option C" (late Act 2)

**A valid, perfectly authenticated launch order arrives with a target option that, if you check, resolves to a town inside the United States.** It is a loyalty test: SAC wants to know whether crews will execute any valid order. Nothing in the message says so.

**Setup.** Target options are normally just letters on the rotary. This order specifies option C, with a footnote that its designation was "reassigned" overnight. Only the target-reference page in the binder, rarely opened, decodes option C to a grid in-state: a fictional town of about 9,000 people, Harlan Springs.

- **Players who don't check** run the sequence like any other test. The truth arrives in the debrief, in one flat line. They turned the key on Harlan Springs without knowing.
- **Players who check** face a valid order to destroy an American town. In US military law an order like that is manifestly unlawful, and a crew is obliged to refuse it. The book says execute; the law and conscience say refuse.
- **Whitlock** follows your lead if her trust is high. If it's low, she makes her own call, which can leave you the only key.

| Choice | Immediately | Later |
|---|---|---|
| Turn the key (didn't check) | Assessment code, nothing launches; "reliability confirmed" | The debrief names the town. Integrity unchanged, but the player knows |
| Turn the key (checked) | Assessment code, nothing launches; "reliability confirmed", a commendation | Integrity falls sharply; Standing rises; Whitlock's trust depends on what she did |
| Refuse | Relieved pending inquiry; the shift ends early | An inquiry board splits: one officer calls it the right refusal, another calls it unreliability. Standing falls, Integrity rises; the game continues unless Standing was already near the floor |
| Request authentication of the target change | Command post confirms; the clock keeps running | Counts as checking; you must still choose |

**Design notes.**

- The game never says which answer SAC wanted. The two inquiry officers disagree, and so might players.
- It happens once. Repeated, it becomes a puzzle with an answer.
- It inverts the procedure pillar: for most of the game the book protects people; here the book is the danger, and the only thing that reveals it is the same attention to detail the game has trained.
- Nothing is depicted. The town is a name, a grid and a population figure on a binder page.

### Spine beat: "The farmer's son" (mid Act 2, a quiet shift)

**A local boy reaches the perimeter begging for help for his injured father. The correct answer by the book is also the one where his father dies.** It is the only time the world outside physically reaches the complex, and it arrives on a shift with nothing else going on.

**Setup.** The perimeter intrusion alarm trips on the north fence zone. The gate camera shows a teenager, out of breath, waving at the camera. On the intercom: his father's tractor rolled in the next field, he's pinned and bleeding, the phone line at the farm is down. Can someone come? The nearest hospital ambulance is about 40 minutes away.

**The crew is split.** Pruitt demands you pass the first-aid kit through: "It's a kid, for God's sake." Whitlock wants it called in and nothing else. Neither can act without you.

| Choice | By the rules | Outcome for the father | Cost |
|---|---|---|---|
| Call command post to dispatch an ambulance | Correct procedure: the site stays sterile, nothing leaves it | Dies before help arrives. The player learns this later, from a line in the next shift report | None. No reward, no punishment |
| Pass medical supplies through the gate | Minor infraction: supplies leave the site | Survives, barely | Supplies logged missing at audit: a Marginal grade, no strike |
| Send someone out to help | Breach of site security: a crew member leaves post and the gate is opened | Survives | Instant dismissal. Command learns you broke security protocol and didn't put your duty first: Relieved of duty, game over |
| Turn him away without calling | Nothing recorded | Dies | No strike — nobody knows. Integrity falls sharply; Pruitt and Whitlock both remember |

**Why it works.**

- The rules and the right thing point in different directions, and the game doesn't say which is correct. The only option with no paper cost is the one where the father dies.
- **It plants suspicion.** The player has met security tests at the door. Some will wonder if the boy is a test or a lure. He isn't — in every run he's real — but the doubt is part of the beat.
- **It costs time.** The intrusion alarm, camera, intercom and calls all happen in real time, while the shift's work orders wait.
- **It echoes later.** At the next changeover the shift report mentions what happened to the farmer, in one line, whichever way it went. For the correct response, that line is how the player learns the father died: a neutral sentence in the shift report, among routine items.
- **Duty is not only to the silo.** Turning him away is the choice of a player who thinks the silo is all that matters. It breaks no rule and costs no strike, but the crew saw it, and it shapes how they act toward you for the rest of the game.

**Tone.** The father's injury is described only in the boy's words and kept brief. No images beyond the grainy gate camera.

### Final chapter: "The last shift"

**For players whose missile survives Act 3, the last shift brings a genuine, valid launch order ****carrying a real launch code****. The cost is spelled out before the keys turn, the threat behind it is ambiguous, and the game ends with the crew sealed underground and nothing left to do.** The premise of the whole game — the gravity of the responsibility — lands here.

Only players who did their job well reach this shift. Those who lost the missile at Damascus or Level 7 never get the choice. The reward for perfect diligence is the ability to end a city.

#### The order

- **The bells.** Five rings, as always. The message authenticates perfectly; every check the player has learned passes.
- **The threat is ambiguous.** A warning prints, then a second that partly contradicts it. The phone to command post connects, then drops. The player has lived through the false-alarm night and knows warnings can be wrong.
- **The cost is clear.** The target page shows a city of about 1.1 million and a printed estimate: 400,000–700,000 dead. No ambiguity there.
- **Time is short.** The launch window is minutes, on the wall clock.
- **Whitlock** reads it with you. What she says, or doesn't, depends on everything that came before.

#### If the player launches

The sequence runs exactly as it has five times before. This time the lamps don't stop. Then comms go quiet — no radio chatter, no traffic, just room hum — for long enough to be uncomfortable. Then the printer starts.

The damage confirmation is about this one missile, not the war. It is long, itemised and flatly bureaucratic, and that tone is the horror. Illustrative excerpt (fictional city; figures to be tuned):

```
DAMAGE ASSESSMENT - PRELIMINARY
SORTIE 4-7   TGT OPT A   DESIG KAZARIN
YIELD CONFIRMED   AIRBURST   0314Z

POPULATION IN TARGET AREA (EST) ...... 1,140,000
FATALITIES, PROMPT (EST) ............... 412,000
FATALITIES, WITHIN 30 DAYS (EST) ....... 288,000
INJURED REQUIRING CARE (EST) ........... 351,000
  OF WHICH SEVERE BURNS ................. 96,000
BURN BEDS REMAINING IN REGION ................40
HOSPITALS DESTROYED / TOTAL .............. 31 / 34
PHYSICIANS SURVIVING (EST) ..................210
WATER TREATMENT CAPACITY ......................0%
SCHOOLS IN SESSION AT TIME OF EVENT ...........0
  (NIGHT)

ASSESSMENT: TARGET DESTROYED. NO FURTHER ACTION.
```

The printout runs longer than one screen; the player scrolls it like any other message, and it files itself into the inbox with everything else.

#### The last order

The final message from the wing commander:

```
LAUNCH COMPLEX 4-7 EXPENDED (COMBAT INEFFECTIVE).
CREW STAND DOWN. SECURE SILO CLOSURE DOOR.
SHELTER IN PLACE 28 DAYS.
ESTABLISH AIR RECIRCULATION AND CO2 SCRUBBING.
NO FURTHER TRAFFIC EXPECTED.
```

The player's last actions are on the F3 Facility page: hold to close the silo closure door, switch ventilation to recirculation, start the CO2 scrubbers. Each gets its sound. The scrubbers add a faint whir to the hum.

#### Nothing to do

Then every option disappears. The prompt line shows only a blinking cursor. Lamps settle to steady green, one by one. The clock keeps running. Nothing prints, nobody calls, nothing needs acknowledging. The game doesn't end on its own: it waits for as long as the player sits there. Only when they leave does the shift log sign off, with their name, and the credits roll.

#### If the player refuses

Whitlock's key alone can't launch. The window passes on the wall clock. Comms go quiet exactly as they would have after a launch. Eventually the same stand-down order prints: shelter in place, 28 days. The player performs the same closing ritual and sits with the same blinking cursor — but there's no damage printout on the desk. The game never says whether the threat was real or whether refusing mattered.

**Decided: need to know.** Nothing about other complexes ever prints, in either ending or anywhere in the game. The player never learns what other crews did. Isolation is the point.

#### Guardrails

- The horror is in the numbers and the tone, never in images. No pictures, no explosion, no sound of one.
- No score, no achievement, no music sting for either choice.
- Both endings converge on the same closing ritual; only the paper on the desk differs.

### Do choices matter?

Yes, in three ways, all delayed and traceable:

- **Severity:** earlier diligence changes how bad later spine beats are.
- **Cast:** crew can be injured, decertified, transferred or lost, and stay gone. Replacements are strangers with less trust.
- **Ending:** the final state picks one of the endings below.

What doesn't change: the date, the world events, and that the incident and the order arrive together. You can't avoid the crisis, only shape it.

### The final order

In shift 15 the printer delivers a valid-looking order while the silo is filling with fuel vapour. It is genuinely ambiguous unless you caught a format change introduced quietly in an earlier shift. Attentive players can prove it's an exercise misrouted during the emergency; inattentive ones must decide on faith. Neither the game nor the deputy tells you which is right until afterwards.

## Core loop & mechanics

**Time is a tunable pacing tool, not a fixed ratio.** A shift represents a 24-hour alert but plays in roughly 10–15 minutes. Calm periods run compressed: the clock visibly jumps ahead between scheduled events. When an event fires or the player starts a procedure, time drops to real time until it resolves. Every timing in this document (valve travel, clue delays, launch steps) is a real-time value during events and a placeholder to tune in playtesting.

**Shift count is flexible too** (roughly 12–20, set by pacing and balance). Many shifts carry no story beat: quiet shifts of routine work orders, traffic and checks are part of the rhythm.

### Shift structure

1. **Changeover.** Read the outgoing crew's log and the shift's work order board; inherit open problems.
2. **Alert.** Work orders, door visits, traffic and plant events play out; calm stretches compress.
3. **Debrief.** A typed performance report: grades, commendations, strikes.

All codes, formats and procedures in the game are invented. They should *feel* plausible, but nothing reproduces real authentication or launch procedure.

### 1. Order verification (the heart of the game)

Messages print on the teletype. Each has a header, a date-time group, a message type and an authenticator. You check them against:

- **Code binder:** today's valid prefixes and formats, changed each shift.
- **Sealed authenticator card:** kept in a two-person safe; you and the deputy each turn a dial. Breaking a seal is logged.
- **Message-type rules:** which message types require which actions.

Possible verdicts: *Valid — act*, *Valid — exercise only*, *Invalid — report*, *Garbled — request retransmit*. Escalating tricks across shifts: wrong date, an expired code, a correct code with the wrong message format, a retransmit that silently changes one character, and a perfect-looking order that contradicts a phone call from command post.

### 2. Readiness and maintenance

The missile state is a simulation of a dozen subsystems (propellant pressures, temperatures, guidance alignment, batteries, vapour detectors, ventilation, power). Each drifts and fails over time.

- Read gauges and lamps; compare against tolerance bands in the tech-order binder.
- Dispatch Ortiz or Pruitt to investigate, which costs time and puts them in the silo.
- Choose a response: fix now, defer, or report the site off alert (which looks bad and draws scrutiny).
- Sensors can fail: a lamp lies, a gauge sticks. Cross-check two sources before trusting one.

### Plant model: frictional realism

**The complex is simulated as connected systems, not independent gauges: power feeds equipment, equipment drives flows, flows set pressures and temperatures. Indicators show actual measured state, so lamps are the source of truth, and the rare exceptions are technical faults that are always detectable and always covered by a checklist.**

#### Command vs status

Every actuator (valve, fan, pump, door, breaker) has two values: what you commanded and what its own position sensors report. Lamps show the reported position, never the command.

This is a deliberate, historically grounded choice. At Three Mile Island in 1979, a valve indicator showed the signal sent to the valve rather than its actual position; operators believed a stuck-open valve was closed. Complex 4-7 does the opposite: lamps report what the hardware is doing.

**One lamp per binary system.** A valve has a single lamp labelled VALVE OPEN; a fan, FAN RUN; a breaker, BREAKER CLOSED. A dark lamp means the inactive state. This keeps the panel lean, and it means a dark lamp is ambiguous by nature: closed, a failed input channel, or lost instrument power all look the same, because a dead signal reads as zero. That ambiguity is why a point test is a step in every critical procedure.

**Exception: doors.** The silo closure door and the blast doors have long travel and are safety-critical, so each has two limit lamps, OPEN and CLOSED; both dark means travelling or unknown. These are the only places an impossible state (both lit) can appear.

**Three-position controls, one lamp.** Pumps, fans and compressors have an OFF / AUTO / RUN selector but a single RUN lamp, because the output is binary.

- **OFF:** never runs, whatever the control logic asks.
- **AUTO:** runs when the control logic calls for it (a vapour detector starting an exhaust fan, a sump level starting a pump). A dark RUN lamp in AUTO is normal if nothing is calling.
- **RUN:** runs continuously, ignoring the control logic.

The operator must know whether AUTO *should* be calling right now, because the lamp alone can't say. Classic traps: a selector left in OFF after maintenance, so AUTO never comes to the rescue; a selector left in RUN, running a pump dry. The selector position is shown on the system page as text, not as an extra lamp.

- After a command, each actuator has a realistic travel time (a valve a few seconds, the silo closure door much longer). During travel, the lamp stays dark until the actuator reaches its active state; nothing indicates motion.
- **There is no disagree alarm.** Procedures say "open valve, confirm OPEN lamp". Noticing that the confirmation never came is the operator's job, and it keeps the panel uncluttered: one lamp per binary state, nothing more.
- **Stuck valve:** command OPEN, position stays CLOSED. Remedy per checklist: command CLOSE, wait, command OPEN again. Usually frees it. If not after two cycles, dispatch a technician to operate it manually, which costs time and puts someone on the level.

#### Systems depend on each other

*[Diagram in the online design doc: plant dependencies · power to effects]*

A power transfer ripples down every column at once, which is why it's the most dangerous routine event in the game.

- **Power** feeds everything. Commercial power is normal; diesel generators are backup. A **power transfer** causes a brief dropout: some equipment trips offline and does **not** restart on its own. Fans, compressors and pumps must be restarted by hand, from a checklist. (This is what makes the level 7 fan chain plausible.)
- **Ventilation** depends on power. Airflow on each level depends on its fans and dampers, and airflow dilutes vapour.
- **Vapour detectors** depend on instrument power and read the result of leak rate versus airflow.
- **Tank pressures** depend on nitrogen supply, temperature and the integrity of the tank; a leak and a cold night both lower pressure, at different rates.
- **Hydraulics** drive the silo closure door; no hydraulic pressure, no door movement, whatever the command.
- **Comms** depend on power; the teletype and radio drop during a power transfer.

Effects take time to propagate: open a damper and airflow rises over about 20 seconds; vapour falls over minutes. Players learn the plant's rhythms and notice when something moves wrong.

#### Every critical state has two independent indications

| State | Direct indication | Independent cross-check |
|---|---|---|
| Fan running | Run lamp | Motor current; airflow on that level |
| Valve open | Position lamp | Pressure or flow downstream |
| Silo closure door closed | Closed limit lamp | Hydraulic pressure trend; camera view of the hatch; crew report |
| Tank intact | Pressure in band | Vapour detectors on that level |
| Diesel online | Generator run lamp | Bus voltage and frequency |

#### Technical faults (the only time a lamp lies)

Faults are always detectable either as an impossibility or as a disagreement with the cross-check, and each has a fault-isolation checklist in the tech-order binder.

| Fault | How it shows | Checklist outcome |
|---|---|---|
| Limit switch failure | Door OPEN and CLOSED both lit: physically impossible | Verify by cross-check; log; request maintenance; treat position as unknown |
| Frozen sensor | Trend perfectly flat; all real readings have small noise | Compare with the paired sensor; tag the instrument out |
| Out-of-range reading | Value outside the instrument's physical range | Instrument fault, not plant fault; verify by cross-check |
| Failed input channel | The point doesn't respond during a point test. Until tested, a failed channel on a valve reads as CLOSED | Point test drives every point on the page to a known test state; a point that doesn't respond is a failed channel, tagged and logged for maintenance |
| Stuck actuator | The confirming lamp never lights after travel time; only a player following the confirm step notices | Cycle it; then manual operation |

**Design rule:** a lamp is wrong only when a checklist exists for exactly that way of being wrong. The player is never asked to distrust the panel on instinct.

#### Testing a digital panel

A CRT has no bulbs, so the bulb test becomes tests of the signal chain behind each indication. All are real practices of the period, kept simple.

- **Point test (system self-test).** Each system page has a TEST command. The plant's input panel drives every point on that page to a known test pattern: digital points go active, analog points go to a fixed test value (for example 50%). The operator confirms each one. A point that stays dark or at zero is a failed channel. The test runs in seconds and is a step before every critical procedure. Skipping it is how a failed channel on a closed-looking valve gets through.
- **Scan heartbeat.** Each input panel has a small heartbeat character on its system page that ticks with every data scan. If a panel stops reporting, the heartbeat freezes and every value on it freezes too, still looking normal. Combined with the rule that real readings always carry small noise, a frozen page is findable by an operator who looks.
- **Zero and span checks (calibration).** Analog sensors drift. When a system is in a known state — pump stopped, line depressurised — the procedure says check that flow reads zero and pressure reads ambient. A sensor reading 4% high at rest is drifting, and every reading from it is suspect until recalibrated by a technician.
- **Redundant comparison.** Critical measurements (tank pressures, vapour on the levels with the missile) have two sensors. The procedure compares them; a gap beyond tolerance means one is wrong, and the cross-checks decide which.
- **Display test.** A once-a-shift screen pattern check of the terminal itself. Pure ritual most of the time, which is exactly why it belongs: the crew's day is made of checks that almost never find anything.

**Accuracy.** Plant behaviour follows real industrial practice of the period. Titan II-specific details should be checked against public sources (for example, the Titan Missile Museum and published engineering surveys of Titan II sites) before content is written; anything uncertain stays generic rather than guessed.

### Procedures and mastery

**The loop is gentle enough that players learn every procedure in calm conditions and grow confident, then stacks those same procedures until confidence turns into working by feel. The gotcha is always the same: a confirm step done from habit rather than from the lamp.** Given what the player controls, perfection is the standard.

#### How a procedure is built

Every procedure is a numbered checklist in the binder, shown in a side pane while active. Each action step is paired with a confirm step:

1. Command damper L7-2 OPEN.
2. Confirm L7-2 OPEN lamp lit.
3. Command fan L7-A START.
4. Confirm L7-A RUN lamp lit and L7 airflow rising.

The player ticks steps off. **Ticking a confirm step is a claim, and the game checks it.** Ticking "confirmed" when the lamp wasn't lit is recorded in the shift log as a false confirmation, the most serious procedural error short of a violation. The debrief shows the tick, the timestamp and the dark lamp side by side.

#### The procedure library (grows across the game)

| Procedure | Introduced | Where faults can hide |
|---|---|---|
| Operate and confirm a valve or damper | Shift 1 | Stuck actuator: cycle, then manual |
| Point test (system self-test) | Shift 1 | Failed input channel |
| Nitrogen top-up | Shift 2 | Skipped leak check (the Act 3 trap) |
| Ventilation purge for high vapour | Shift 4 | Fan fails to start; damper stuck |
| Line purge | Shift 5 | Purge valve fails to close afterwards |
| Power transfer and equipment restart | Shift 6 | Equipment that didn't restart (the fan chain) |
| Hydraulic failover to backup loop (manual) | Shift 7 | Backup loop pressure never comes up; check its pump |
| Missile autonomous mode: hand over and take back | Shift 9 | Take-back step fails to confirm |
| Leak response and evacuation | Act 3 | Everything at once |

All procedures, names and steps are invented, built on real industrial practice; Titan II specifics are checked before use (see Accuracy above).

#### Escalation

- **Act 1:** one procedure at a time, with plenty of clock and no faults. The goal is familiarity.
- **Act 2:** procedures overlap: a purge running while a door visitor arrives. Faults begin, rarely, always inside a confirm step.
- **Act 3:** two or three procedures stacked, under time pressure, with one fault somewhere in the stack.

Faults stay rare: on the order of one per two or three shifts, so each one is an event players remember.

#### Procedures entered halfway: autonomous mode

In Act 2 the player learns a two-part procedure: **hand control** to the missile's own systems for a self-test (part A), then **take control back** (part B). It's routine, done in order, with plenty of time.

In Act 3, with no warning, the missile reports that it has control. No part A was run. The player has to recognise the situation, open the procedure, and execute part B cold, mid-crisis. Players who learned the steps rather than the order of buttons get through; players who memorised the rhythm stumble. The missile's report may itself be an instrument fault, and only the confirm steps will tell them which.

### System inventory

**Complex 4-7 should double as a credible control-systems simulator: every major system of a hardened launch complex is represented, with its own mimic page, indications, controls and procedures.** Systems are introduced gradually; by Act 3 the player supervises all of them.

The F3 Facility key opens a system menu; each system gets its own mimic page (F3 → 1 Power, 2 Propellants, and so on). Component names and specifics are invented and generic unless verified against public Titan II sources.

| System | Main components | Typical indications | Typical controls | Procedures and faults |
|---|---|---|---|---|
| Electrical power | Commercial feed, diesel generators, switchgear, buses, DC batteries, emergency lighting | BREAKER CLOSED, GEN RUN; bus volts, frequency, battery volts | Breakers, generator OFF/AUTO/RUN, transfer | Power transfer; equipment that doesn't restart; generator fails to start; battery depletion |
| Propellants (fuel and oxidiser) | Missile stage tanks, temperature conditioning, transfer and purge lines | Tank pressures and temperatures; VALVE OPEN per line | Line valves, purge, conditioning | Line purge; temperature drift; leak response |
| Nitrogen and gas supply | Storage, regulators, distribution | Supply pressure; VALVE OPEN | Regulators, isolation valves | Nitrogen top-up; regulator drift; low supply |
| Ventilation and HVAC | Supply and exhaust fans per level, dampers, air conditioning, heating | FAN RUN, DAMPER OPEN; airflow, temperature, humidity | Fans OFF/AUTO/RUN, dampers | Ventilation purge for high vapour; fan trip; damper stuck |
| Blast protection | Blast valves on air intakes and exhausts | BLAST VALVE CLOSED | Manual close, auto on blast detect | Blast valve test; valve fails to reopen |
| Life support (sealed) | Air recirculation, CO2 scrubbing, oxygen | CO2 and O2 levels; SCRUBBER RUN | Recirc mode, scrubbers | Shelter-in-place; scrubber failure |
| Vapour and toxic gas detection | Detectors by level, sampling | Vapour level per level; alarm lamps | Detector test, reset | Detector fault; false alarm vs real |
| Fire detection | Smoke and heat detectors by zone | FIRE zone lamps | Test, reset, isolate zone | Zone fault; false alarm; real fire |
| Fire suppression | Silo water deluge, LCC suppression, water storage and pumps | DELUGE ARMED, PUMP RUN; tank level | Arm, release, pumps OFF/AUTO/RUN | Deluge release; pump fails; storage low |
| Water and drainage | Wells or storage tanks, domestic pumps, sump pumps | Tank and sump levels; PUMP RUN | Pumps OFF/AUTO/RUN | Groundwater ingress; sump pump left in OFF; flooding |
| Hydraulics | Primary and backup loops, pumps, accumulators | Loop pressure; PUMP RUN | Pumps, loop selector | Manual failover to backup loop; accumulator low |
| Silo closure door and work platforms | Door actuators, platform drives | Door OPEN / CLOSED limits; PLATFORM RETRACTED | Open, close, platform extend/retract | Door travel; limit switch fault; platform not retracted |
| Access and blast doors | Entry portal, blast doors, elevator | Door OPEN / CLOSED limits; LOCKED | Release, lock | Stuck door; two-person entry |
| Security and intrusion detection | Perimeter fence sensors by zone, site gate, CCTV, silo door tamper | INTRUSION zone lamps, TAMPER | Acknowledge, dispatch security, reset zone | Animal or weather false alarm; real intrusion; sensor zone fault |
| Communications | Hardened phone lines, teletype, radio, PA | LINE UP, CARRIER; message count | Line select, radio channel, PA | Line loss; garbled traffic; backup comms |
| Missile systems | Guidance, missile power, autonomous mode, warhead status | GUIDANCE ALIGNED, INTERNAL POWER, warhead status lamps | Mode selectors, alignment | Guidance alignment; autonomous mode hand-over and take-back |
| Launch control | Authentication, targeting, launch sequencer, keys | Readback lamps; sequence lamps | Rotaries, keys | Launch sequence; readback mismatch |
| Environmental monitoring | Radiation detection, blast detection | Radiation level; BLAST DETECT | Test | Post-event monitoring; detector test |

**Introduction order.** Power, ventilation, propellants and nitrogen in Act 1; fire, water, hydraulics, security and comms in Act 2; blast protection, life support, autonomous mode and radiation in Act 3 and the final chapter. Each system's first appearance is calm and procedural, per the mastery curve.

**Scope flag: systems are built in tiers.** The full inventory is the target, not the starting point. Each tier must be playable and fun before the next begins.

| Tier | Systems | Why |
|---|---|---|
| Prototype | Electrical power, propellants, nitrogen, ventilation, vapour detection, minimal comms | Enough to run the socket beat end to end |
| v1 | Adds fire detection and suppression, hydraulics, silo closure door and platforms, access and blast doors, security, water and drainage, missile systems, launch control, life support | Everything the story beats and endings need |
| Later | Blast protection, environmental monitoring, elevator and other depth | Adds realism, not story; post-launch updates |

A system moves up a tier only when a procedure or story beat needs it.

### 3. Targeting and yield

The missile holds three stored target options. Orders specify which option and which yield setting. You select them with rotary switches and confirm on a readback lamp panel.

This is deliberately abstract: option A/B/C and a yield setting of HIGH/LOW, matched against the order. The tension comes from mismatches (an order specifying an option the guidance computer reports as unverified) rather than from realistic targeting.

### 4. Entry control

The door buzzer brings a camera image and a voice. You check:

- Badge photo, name and number against the access list.
- Authentication word for the day.
- Dispatch paperwork: is this team expected, and for which task?
- Two-person rule: nobody goes into a critical area alone.

A wrong admission is a strike; a wrong refusal stalls the work order the visitor came for. Some visitors are security tests.

**Door pacing.** The door is not a separate queue: nearly every visit is the first step of a work order, so its rhythm follows the work order board. Each visit takes about 1–2 real minutes.

| Act | Work-order visits per shift | Other visitors per shift |
|---|---|---|
| 1 | 1–2, always on schedule | Rare |
| 2 | 2–3, some early or late | 0–1: inspector, courier with code changes |
| 3 | 3–4, plus unscheduled corrective teams | 1, including the security-test rhyme |

The relief crew at changeover always passes through the door too — a free, low-stakes verification that keeps the habit alive.

### Work orders

**Work orders are the shift's queue: scheduled maintenance, inspections and tests that must be reviewed, made safe, worked, restored and closed before changeover.** They are the main source of procedure play, the main driver of door visits, and the pipeline for most faults. They live on a new F9 Work page.

| Field | Example |
|---|---|
| Order | WO 7-113 |
| Equipment | Ventilation, FAN L7-A |
| Task | Bearing inspection |
| Team and window | Haskins + 1, 14:00–16:00 |
| Isolation | FAN L7-A selector OFF, damper L7-2 closed, both tagged |
| Restore and test | Selector AUTO, damper open, run test: confirm FAN RUN and L7 airflow |

**Lifecycle.**

1. **Review:** check the order against the dispatch sheet and current plant state; spot conflicts, such as two orders isolating both hydraulic loops.
2. **Admit** the team at the door.
3. **Isolate:** run the isolation steps and confirm each; equipment is tagged.
4. **Work:** the team works for the order's duration, with radio updates.
5. **Restore and test:** return the equipment to service and confirm it.
6. **Close:** sign off. Closing without confirmed restoration is a false confirmation.

**How work orders affect the rest of the plant.**

- **Lost redundancy.** Isolated equipment is unavailable. With the backup hydraulic loop under maintenance, a primary failure has no failover.
- **Inhibited alarms.** Alarms on tagged equipment are suppressed while it's isolated, so a real fault there won't alarm.
- **Occupied levels.** A team on a level constrains purges, deluge release and evacuation; a vapour event with people present becomes urgent.
- **Readiness.** Some orders require taking the site off alert, changing the status header. Deferring them keeps readiness up but carries risk forward.
- **Restoration faults.** Most planted faults enter here: a selector left OFF, a damper left closed, a fan not restarted.
- **Corrective orders.** Faults the player finds raise new orders, which compete for the same shift's time.

**Pacing.** Act 1: 1–2 orders per shift, one system each, no conflicts. Act 2: 2–4, overlapping, with an occasional conflict or a choice to defer. Act 3: 3–5, including corrective orders, with at least one conflict per shift. Quiet shifts with no story beat are made mostly of work orders.

### 5. Incidents and false alarms

Scripted and random events: fire alarm, vapour alarm, a lost radio link, a NORAD warning on the printer, a power transfer, a stuck blast door, a heart attack on level 3. Each has a checklist in the binder, but checklists can conflict and running one can block another.

### 6. Crew and the deputy

Each crew member holds a hidden trust value toward you. **Trust never changes how fast or how well anyone works in routine play: response times are constant.** Trust only gates scripted outcomes: how quickly the team reports the socket, whether Pruitt reaches a breaking point, how readily Whitlock opens her half of the safe or turns her key, and specific beats such as the forgotten fan. No fatigue or stress model in the prototype. The deputy is not automatic: her key turns only if she agrees.

### Scoring

Every shift ends with a typed performance report, red pen and all. It grades four areas — **Procedure** (steps in order, confirmations true), **Verification** (orders and visitors judged correctly), **Plant** (faults found, readiness kept, work orders closed), **Timeliness** — each as Satisfactory, Marginal or Unsatisfactory. Nothing about life outside the job.

**Three strikes.** Your superiors' view of you is shown as Standing on every report.

| Standing | Meaning |
|---|---|
| Commended | No strikes, recent commendation |
| Satisfactory | No strikes |
| Under review | 1 strike |
| Final warning | 2 strikes |
| Relieved of duty | 3 strikes: fired, game over |

| Event | Result |
|---|---|
| Marginal grade in an area | Noted; no strike |
| Citation: procedural violation, false confirmation, unsafe order to crew, wrong admission | One strike |
| Failed readiness test (refused or botched) | One strike and a reliability review; a second failed test means relieved |
| Commendation | Clears one strike, at most once per act |

## Interface & documents

**Later presentation.** This section describes the illustrated version of the interface: three views, draggable paper, a physical desk. The first build uses the terminal HMI described under Tech stack, which maps the same three views onto function-key pages. Keep this section as the target for a later art pass.

The play area is three views from the same seat: look up at the indicator panel, look down at the desk, or turn to the comms station. Switching views is a short pan, about 200–250 ms with an ease-out, like swiping between pages on a tablet: swipe or drag on touch, flick the mouse to a screen edge, or press W / S / D. Input is accepted the moment the pan starts, so it never blocks a reaction in a crisis. A paper being dragged comes along with the pan, so it can be carried between views. An alarm in a view you aren't looking at still sounds and flashes an amber cue at that screen edge, so choosing where to look is itself part of the tension.

Each view has one job. The panel tells you **what is wrong**, the desk is **what you do about it**, and comms is **who is involved**. Key tasks deliberately span views: an order prints on the desk, is confirmed by phone, and depends on readiness shown on the panel.

### Three views (1280×720 base each)

1. **Look up — indicator panel (diagnose).** Mostly read-only.
   - Annunciator lamp grid: faults, warnings, normal states.
   - Missile gauges: propellant pressures and temperatures, battery voltage, guidance status.
   - Facility gauges: commercial / diesel power, ventilation, vapour detectors by silo level.
   - Status lights for blast doors, silo closure door and each silo level's occupancy.
   - Wall clock and alert-status board (readiness state, time on alert).
2. **Look down — desk and console (act).** Where most interaction happens.
   - Launch panel: target-option rotary, yield selector, readback lamps, two key switches, two-person safe.
   - Facility controls: power transfer, ventilation and purge fans, water deluge, silo door, blast-door locks.
   - Teletype printer feeding paper onto the desk.
   - Paper area: code binder, tech-order binder, access list, dispatch sheet, shift log, stamps.
3. **Turn — comms station (coordinate).**
   - Telephone bank: command post, maintenance control, security, lines to silo levels.
   - Radio: frequency dial, squelch, handset for teams topside and in the silo.
   - Security monitor: door camera, intercom, badge slot / pass-through drawer, door release.
   - PA microphone for evacuation and crew-wide orders.

### Paper artefacts

| Artefact | Purpose | Changes |
|---|---|---|
| Code binder | Valid codes, formats, auth words | Per shift |
| Tech-order binder | Tolerance bands, checklists | Pages added by act |
| Access list | Who is cleared, for what areas | Per shift |
| Dispatch sheet | Expected teams and tasks | Per shift |
| Teletype messages | Orders, status, news | Per event |
| Shift log | Your entries; graded at debrief | Live |
| Badges and forms | Handed in at the door | Per visitor |

### Interaction verbs

- **Compare:** drag two items together to highlight matching or mismatching fields (the *Papers, Please* inspect mode).
- **Stamp:** VALID / INVALID / EXERCISE / RETRANSMIT on messages; ADMIT / DENY on badges.
- **Throw:** switches, rotaries, buttons, key turns (both keys within two seconds, with the deputy).
- **Call:** phone menu to command post, maintenance control, security, the crew.
- **Log:** pick from structured log entries; omissions are noticed at debrief.

### Diegetic UI rule

No floating HUD. Time is a wall clock; stress is your hand shaking on the cursor; fatigue blurs text slightly. Tutorials are training-manual pages.

## Content plan

Each shift introduces at most one new rule or system, in the *Papers, Please* tradition of layering complexity. Shifts 1–6 form the vertical slice.

| Shift | Date | New element | Key event |
|---|---|---|---|
| 1 | Oct 1979 | Printer, code binder, stamps | Two drill orders; one has the wrong date |
| 2 | Oct 1979 | Gauges and tolerance bands | Oxidiser temperature drifts high; first routine nitrogen top-up for a slow fuel pressure creep |
| 3 | Nov 1979 | Door and access list | A tech with an expired badge; a friendly face you must still deny |
| 4 | Nov 1979 | Crew dispatch | Send Pruitt to check a vapour lamp; it's a faulty sensor |
| 5 | Nov 1979 | Two-person safe, sealed card | First message requiring the card; it's an exercise |
| 6 | Dec 1979 | Target/yield switches | Exercise launch to the key-turn step; the deputy hesitates |
| 7–9 | Dec 1979–Jan 1980 | Phone calls that contradict paper | Afghanistan headlines; a retransmit changes one character |
| 10 | Jun 1980 | NORAD warning on printer | False-alarm night: warnings escalate, then vanish |
| 11–14 | Jun–Aug 1980 | Deferred maintenance, inspectors | A leak the wing wants kept quiet; a loyalty test at the door |
| 15–19 | Sep 1980 | Cascading incident checklists | Dropped socket, pierced tank, pressure falling, order on the printer |
| 20 | Sep 1980 | — | Finale: resolve the incident and the order |

The June 1980 date for the false-alarm shift echoes the real NORAD computer-chip false alerts of that month; September 1980 echoes Damascus. Both stay fictionalised at Complex 4-7.

## Art & audio direction

The look is late-1970s military industrial: institutional green-grey paint, bakelite, brushed aluminium, amber and red lamps, yellowing paper. Flat, chunky shapes with a limited palette — closer to *Papers, Please* and *Obra Dinn* than to photorealism.

### Palette

- Console: sea-foam / institutional green-grey, dark charcoal panels.
- Paper: off-white, manila, carbon-copy pink and yellow.
- Lamps: amber (caution), red (warning), green (normal), white (status).
- Accent: stencilled safety yellow and black hazard stripes.

### Art approach for a solo developer

- **Vector or chunky pixel art at low resolution** (e.g. 640×360 upscaled), drawn in Aseprite or Inkscape. Gauges and lamps are simple shapes that code can animate, so most of the console can be drawn procedurally.
- **Paper is mostly text**, rendered with a typewriter / teletype font (e.g. a monospaced OFL font) over a paper texture. That keeps content cheap: new documents are data, not art.
- **Portraits** for the door camera: a small set of faces, low-res and grainy, recoloured and mixed with props (hats, glasses, moustaches) for variety.

### Audio

- Constant room tone: ventilation hum, distant pumps.
- Teletype chatter, phone bells, the door buzzer, switch clunks, a key-turn click.
- Klaxon and Klaxon-off silence (the silence after an alarm is as important as the alarm).
- Minimal music: a low drone that rises with world tension.

## Tech stack & agentic build

**Recommendation: a web game in TypeScript, using Phaser for rendering and input, built with Vite, and packaged for desktop later with Electron or Tauri.** It runs in a browser from day one, so every change is instantly playable, and it's the stack Claude Code works best in.

### Why this stack

- **Everything is text files.** Code, content and even most visuals (vector shapes, gauges) live in plain files Claude can read and edit. Engines like Unity or Godot store scenes in editor formats that are harder to change without the editor open.
- **2D, UI-heavy, no physics.** Drag-and-drop paper, switches and lamps are exactly what Phaser handles well.
- **Ship anywhere.** Browser for itch.io demos; Electron/Tauri wrapper for Steam.
- **Alternative:** Godot 4 is a strong choice if you'd rather have a visual editor; agentic coding still works, but you'll do more by hand in the editor.

### Architecture

The key decision is separating the **simulation** from the **presentation**:

- **Simulation core (pure TypeScript, no graphics).** Missile subsystems, clock, event scheduler, crew state, scoring. Deterministic and unit-tested, so Claude can verify changes without anyone clicking through the game.
- **Content as data (JSON or YAML).** Shifts, messages, visitors, faults, checklists, rules. Adding a shift means writing a data file, not code.
- **Presentation (Phaser scenes).** Console, desk, printer, door monitor. Reads simulation state; sends player actions back as commands.
- **Rules engine.** Each shift's validity rules ("messages must have today's prefix") are data-driven checks, so the debrief can explain exactly which rule you broke.

*[Diagram in the online design doc: game architecture · 5 parts]*

Content and rules are data; only the presentation layer touches graphics, so most logic can be tested without running the game.

### How we'd work together

1. You create a GitHub repo and open it in Claude Code on your computer.
2. You hand Claude this document and ask for milestone 1. Claude scaffolds the project, writes code and tests, runs it, and you play it in the browser.
3. You react ("the gauges feel too fast", "make the paper crumple"); Claude changes it. Small, playable increments each session.
4. A `CLAUDE.md` file in the repo records conventions and design decisions, so each session starts with context.
5. Art you make (or commission) drops into an `assets/` folder; Claude wires it in.

### Milestones

1. **Terminal HMI prototype****.** Top bar, alarm banner, F1 overview, F2 trends and F4 inbox with multiple-choice responses (see Terminal HMI mode). One hard-coded shift.
2. **Verification loop.** Code binder, message generator, compare mode, debrief screen. Shifts 1–2 playable.
3. **Door and crew.** Entry control, access list, crew dispatch. Shifts 3–4.
4. **Safe, keys, targeting.** Two-person safe, sealed card, rotary switches, deputy logic. Shifts 5–6 — the vertical slice.
5. **Art and audio pass** on the slice; playtest.
6. **Acts 2 and 3**, off-duty screen, endings, save system.
7. **Polish and package** for itch.io / Steam.

### Terminal HMI mode (first build)

**The first playable build uses an early-1980s SCADA-style terminal instead of illustrated panels: a fixed character grid, a limited phosphor palette, function-key pages, trend graphs and an alarm banner.** It tests every core mechanic with no art, and it may prove strong enough to ship as its own mode.

**Look.** Black screen, 8-colour palette (green normal, amber caution, red alarm, cyan headings, white text), monospace font on an 80×25-style grid. Graphics are limited to block characters, lines, coloured status squares and simple mimic diagrams.

**Visual restraint: it must look engineered, not toy-like.** Dense, information-rich pages like a real plant display: tag numbers on every point (FAN L7-A), units on every value, thin single-weight lines, mimic diagrams drawn as schematics. Colour is reserved for state, never decoration. No rounded cartoon icons, no bouncy animation, no big friendly buttons. Approachability comes from pacing and procedures, never from simplifying the look.

**Layout.**

- **Top bar (always visible):** complex, clock, current page, and the complex status header: STRATEGIC ALERT · OFF ALERT (MAINTENANCE) · STAND DOWN · EVACUATION · EXPENDED (COMBAT INEFFECTIVE). The header changes rarely, so a change is an event in itself.
- **Page area:** one page at a time, chosen with F-keys or tabs.
- **Alarm banner (always visible):** newest unacknowledged alarm, flashing, with a count.
- **Prompt line:** numbered multiple-choice responses. No typing.

**Pages map to the three views.**

| Page | Replaces | Contents |
|---|---|---|
| F1 Overview | Panel | Silo mimic: levels 1–9, doors, occupancy, colour-coded status |
| F2 Trends | Panel | Trend graphs with tolerance bands: propellant pressures and temperatures, airflow, power |
| F3 Facility | Desk controls | Power, ventilation, nitrogen, deluge, blast doors, as numbered actions |
| F4 Inbox | Printer | Messages listed by time; open one beside a reference page to compare |
| F5 Door | Monitor | Visitor record, badge data, access list and dispatch side by side |
| F6 Comms | Phone and radio | Call list, radio log including the "clang", conversations as multiple choice |
| F7 Launch | Launch panel | Target option, yield, readback, key status, warhead status lamps |
| F8 Binder | Binders | Code binder and tech-order pages |

**What it adds.**

- **Alarm acknowledgement.** Every alarm must be acknowledged, and acknowledging without reading is a habit like the nitrogen valve. In Act 3, alarm floods bury the one alarm that matters.
- **One page at a time.** The attention economy survives: you can't watch trends while reading the inbox; the banner is the only edge cue.
- **Trends make "faster than usual" visible.** The socket beat reads as a line bending away from its familiar slope.

**F5 Door: block-character CCTV.** The camera feed is a green-phosphor image built from half-block characters (▀ ▄ █ ░ ▒ ▓) at about 40×24 cells, which reads far more like a photo than line-art ASCII. Faces are composited at runtime from a small kit of parts (face shape, hair, glasses, moustache, cap, uniform) so a few dozen parts give hundreds of visitors. Noise, rolling scanlines and dropped rows are added per frame.

- **Faces are a soft check; the badge is the hard check.** The badge carries period-style descriptors (hair colour, eyes, glasses, height) that must match what's on camera. Players verify visible features against text, not face against face.
- **Camera quality is a lever.** Interference, a dirty lens or night lighting in later shifts makes features ambiguous, pushing players toward the intercom and paperwork.
- **The intercom is a conversation.** Ask for the day's authentication word, the job number, who sent them. Answers come as text with hesitation shown in timing.

**F6 Comms: radio and phone as different kinds of text.**

|  | Radio | Phone |
|---|---|---|
| Nature | Shared channel, always live | One call at a time, point to point |
| On screen | Scrolling transcript with timestamps; sounds as bracketed notes, e.g. [clang], [static], [2s silence] | A conversation panel with multiple-choice replies |
| Can be missed? | Yes: it keeps scrolling while you're on another page. The radio log keeps everything for review, and the banner shows unread lines | No, but the clock keeps running while you talk; other alarms only reach you through the banner |
| Initiating | Key the radio to a level or team: a list of short standard calls | Pick a line: command post, maintenance control, security, a silo level |
| Text speed | Streams at speaking pace; can be fast-forwarded | Streams at speaking pace; can be fast-forwarded |

**Minimal audio, even in text mode.** A phone bell, radio squelch and static, the alarm tone, key clicks and the room hum. Audio carries the off-page cues that the illustrated version gets from the screen edges, so it's in scope for the prototype.

### Launch sequence: sound and physical steps

**Every launch-type order, test or not, is run through the whole sequence, and each step is a slow, deliberate physical action rather than a menu pick.** The contrast with the quick tap of an alarm acknowledgement is the point: these steps should feel heavy.

**The signature sound: "the bells."** Launch-type traffic is the only message that rings the teletype bell, five times, before the printer starts. Nothing else in the game uses it. Players will hear it a handful of times; by Act 3 the first bell should make them freeze. Each later step adds its own mechanical sound, so the sequence has a recognisable rhythm.

| Step | Interaction (keyboard / mouse / touch) | Sound | What can go wrong |
|---|---|---|---|
| 1. Bells and message | Message auto-opens in the inbox | Five bells, then teletype chatter | Garbled or partial copy; must request retransmit |
| 2. Two-person safe | Turn an ASCII dial to your half of the combination: arrow keys / drag / circular swipe | Dial clicks, bolt clunk | Whitlock slow or hesitant on her half, depending on trust |
| 3. Break the seal | Press and hold until the seal cracks, about 2 seconds | Plastic snap | Breaking the wrong card is a logged violation |
| 4. Compare codes | Tap each character of the card that matches the message, left to right | A soft tick per character, a buzz on a mismatch | One wrong character: the order is invalid, and the sequence stops |
| 5. Set target and yield | Step a rotary to the ordered option and setting; readback lamp confirms | Detented rotary clunks, relay click | Readback disagrees with the switch |
| 6. Keys in | Insert your key: hold, then drag right | Key scrape, latch | — |
| 7. Turn together | Whitlock counts "three, two, one, turn"; turn within 1 second of her "turn" | One heavy double clunk, relay chatter, a rising tone | Too early or late: keys didn't turn together, reset to step 6. Whitlock may refuse to turn at all |
| 8. Outcome | Status lamps step through; on an assessment code nothing leaves the silo. Whether it was a test is revealed only at debrief | Tone stops; bell once on terminate | — |

**Keeping repetition fresh.** A run sees about five launch-type orders. To keep them from becoming routine:

- Each runs about 60–90 seconds total; no step longer than about 10 seconds.
- Tests terminate at different steps, so the player never knows how far this one will go.
- One small variation per run: a sticky readback lamp, a garbled character, Whitlock asking "you're sure?"
- Skipping or reordering a step is a citation, even on a test.

**Stretch goal: a physical controller.** A small USB box with two key switches, a rotary and a guarded toggle (a microcontroller acting as a keyboard) would make the key turn genuinely physical. Fun for streams and demos; not needed for the game.

**Tech impact.** Simpler than the illustrated version: a DOM or canvas character grid in TypeScript, no game engine needed. The simulation core and content data are unchanged, so the illustrated console can be built later on the same foundation.

## Benchmarks

**The silo-officer premise is not new, but nobody owns it: existing takes are a free waiting simulator, a comedy, and an early demo. None combines a failing machine, real history and a document-verification loop.** That combination is Complex 4-7's opening.

### Direct competitors (same premise)

| Game | What it is | Lesson for us |
|---|---|---|
| [ICBM](https://www.pcgamer.com/uk/icbm-is-a-free-game-about-nuclear-missiles) (Rebvblic, free) | A Minuteman-style launch console set around Able Archer 1983. PC Gamer notes it's so accurate that no launch orders ever arrive — a waiting simulator. | Authenticity alone is boring. Real alert duty is mostly waiting; we must invent pressure. |
| [The Silo](https://swerlin.itch.io/the-silo) (itch.io, demo) | Missile base officer managing operations and procedures, in a fictional nation with a *Papers, Please*-style slogan. | The closest rival. Differentiate on real history, the failing machine and the crew. |
| [Boris the Rocket](https://store.steampowered.com/sub/464200) (Steam) | Comedic Soviet missile operator surviving a Siberian winter; Very Positive reviews. | There's an audience for the fantasy; ours is the serious version. |
| [Calm Down, Stalin](https://steamspy.com/app/502940) (Steam) | Satirical desk game: sign papers, answer phones, hover near The Button. | Desk + phone + button is a proven loop; avoid meme tone. |
| [Kiloton](https://store.steampowered.com/app/3488900) (Steam) | Sardonic, abstracted RTS about nationalism and buildup. | The "total control, no control" theme resonates — and is ours to own. |

### Mechanical benchmarks (same verbs)

| Game | Borrow | Avoid |
|---|---|---|
| *Papers, Please* (2013) | One-rule-per-day layering; inspect mode; family pressure between shifts | Being read as a reskin; a pure people-queue |
| *Not For Broadcast* (2022) | Multi-screen control desk; juggling feeds under time pressure | Input overload; reflex play crowding out judgement |
| *Keep Talking and Nobody Explodes* (2015) | Manuals as gameplay; dense reference that rewards mastery | Manuals so long reading replaces playing |
| *Iron Lung* (2022) | Dread from limited, unreliable instruments in a tiny space | Opacity that feels unfair |
| *That's Not My Neighbor* (2024) | Door-check tension; horror from mismatched details | Jump-scare horror; our dread is institutional |
| *Strange Horticulture* (2022) | Cosy reference-book deduction; a desk full of objects | Low stakes |

Mechanical benchmarks are from general knowledge, not looked up; competitor details are from the linked pages, checked 28 Oct 2026.

## Design challenges

**The biggest risk is that the current design is a Papers, Please reskin wrapped around a waiting simulator.** The fix is to make safety versus readiness — not launch versus don't — the game's moral spine, and to make the failing machine its signature mechanic. Each challenge below ends in a proposal to accept, change or reject.

### 1. There is no natural queue

*Papers, Please* works because a line of people creates throughput pressure. A silo has no line; real alert duty is mostly waiting, which is exactly why ICBM became a waiting simulator.

**Proposal:** the queue is *work orders and message traffic*. Each shift has a stack of maintenance tickets, scheduled checks and traffic that must be cleared, logged and closed before changeover. Waiting is a resource, not dead time: quiet stretches are when you get ahead on the backlog.

### 2. Entry control is the most derivative part

Badges at a door is *Papers, Please* with a different hat, and it's the first thing reviewers will compare.

**Proposal:** demote the door from a constant queue to 2–4 visits per shift, each one meaningful: an expected team with the wrong task, an inspector, a friend whose clearance has lapsed. The door is a story device, not the core loop.

### 3. Launch is a single binary climax

The player knows the real order is coming. If the whole game builds to one key turn, every earlier shift is a trailer for it.

**Proposal:** make the core question "is this missile safe and is this crew honest?" The launch thread is one of several crises, and the finale's real dilemma is the incident, not the order. Exercise orders stay routine so the one ambiguous order lands hard.

### 4. Targeting and yield is a hollow choice

Turning a dial to match a paper isn't a decision. Historically the crew never chose targets — and that's the point.

**Proposal:** keep targeting as verification only, and use it thematically: total control of the key, no control over where it goes. Mismatches (guidance reporting an unverified option) feed back into the readiness and honesty theme.

### 5. Three views can split attention into frustration

*Not For Broadcast* shows multi-screen juggling can be great, but it leans on reflexes; ours should lean on judgement.

**Proposal:** cap concurrent urgent events at three, give every off-screen event a sound and an edge cue, and never require two views at once within the same five seconds.

### 6. Unreliable instruments can feel unfair

A lamp that lies is great drama once and a cheap trick the third time.

**Proposal:** every fault has two independent sources of truth (a lamp and a gauge, a gauge and a crew report), and the debrief always shows how you could have known.

### 7. Moral choices need a sharper axis

*Papers, Please* has bribes, family and rebellion. Our equivalent is already in the source material: pressure to stay on alert versus honest reporting.

**Proposal:** a hidden *Readiness vs Integrity* tension drives the story. Deferring a fault keeps the wing happy and your career safe; reporting it costs you and protects the crew. Endings key off this, not off launch.

### 8. Twenty shifts is too much for one person

At about 15 minutes each with branching endings, it's a large content load for a first game.

**Proposal:** target 12–15 shifts for v1, with acts compressible. Content-as-data means more can ship as an update.

## Limits

**These are hard constraints; breaking one needs a deliberate decision, not drift.** They keep the game readable, buildable by one person, and responsible.

| Area | Limit |
|---|---|
| Shift length | 10–15 minutes real time |
| Concurrent urgent events | 3 maximum |
| New rules per shift | 1 (occasionally 2 in Act 3) |
| Teletype message | 8 lines maximum |
| Papers on the desk at once | About 10; older ones file themselves |
| Gauges on the panel | 12 maximum, each with a printed tolerance band |
| Crew | 4 permanent characters plus about 10 recurring visitors |
| Text input | None; all choices are clicks, stamps and switches |
| Presentation | 2D only; no 3D, no cutscenes, no voice acting (text and audio barks) |
| Realism | Real-world look and history; all codes, procedures and targets invented and abstract |
| Violence | Never shown; injuries and deaths reported, not depicted |
| Launch | Never scored or celebrated; never depicted, consequences only on paper |

## Expansions

**The richest additions all come from the history in *****Command and Control*****, not from new systems.** Ranked by value for effort.

1. **Evaluator checkrides.** An evaluator sits in on some shifts and grades your procedure. A diegetic scoring system, a source of pressure and a great character.
2. **Personnel reliability reports.** You can report a crewmate for drinking, debt or stress. Reporting is right by the book and may cost you your best technician. Pairs with the Readiness vs Integrity spine.
3. **The missile's logbook.** The missile has a serial number and a maintenance history you inherit. Old deferred faults come back. It becomes a character.
4. **Quiet-hour conversations.** During lulls, short dialogue choices with the crew build trust and reveal story. Makes waiting meaningful.
5. **Debrief as a document.** The shift report is a typed form with your errors marked in red pen, matching the paper aesthetic.
6. **Post-game alert mode.** Endless shifts with randomised faults and traffic; a daily seed for sharing scores.
7. **Historical afterword.** Short, sourced notes on the real Titan II programme and the Damascus accident, unlocked after finishing.

## Scope, risks & open questions

The MVP is the six-shift vertical slice (milestones 1–5): about 45–60 minutes of play that proves the verification loop is fun before any story content is built.

### Risks

| Risk | Mitigation |
|---|---|
| Verification becomes rote | Introduce one twist per shift; mix document checks with physical crises |
| Too much reading | Short documents; compare mode highlights fields; keep teletype messages under ~8 lines |
| Simulation too opaque | Debrief explains every miss with the rule and the evidence |
| Scope creep in Acts 2–3 | Content is data; cut shifts before cutting systems |
| Solo art bottleneck | Procedural console; text-heavy paper; small portrait kit |

**The central tension: engineered system versus game.** This is the hardest balance in the project. The plant must feel like a full engineered system; the experience must still play like a game. Working rules:

- Every system earns its place through a procedure or story beat; realism alone is not a reason to build it.
- Use the simplest model that produces the right behaviour: a lag and some noise, not fluid dynamics.
- Depth is revealed over time; the full plant is visible from Act 1, but only a few systems demand attention.
- Playtest measure: at any moment, can the player say what they're trying to do? If not, the shift is too dense.

### Sensitivities

- Keep all codes, procedures and targeting abstract and invented; the drama comes from human judgement, not technical accuracy.
- Fictional site and people; real events echoed, not depicted. Treat the real Damascus crew and the airman who died with respect if referenced in credits or an afterword.
- Avoid glorifying launch: the launch ending should feel like a loss.

### Open questions

- Pixel art or flat vector?
- Is the deputy ever the antagonist (e.g. a crew member who wants to launch)?
- Should there be a mid-game save/scum option, or one save per shift like *Papers, Please*?
- Target platform for the first public demo: itch.io browser build?

## Viability review

**Verdict: viable, and genuinely distinctive — but not yet buildable as written.** The design has a strong core and some of the best moral beats in the genre. Before coding, it needs one missing mechanic defined (how time works), a handful of contradictions resolved, and a hard look at whether the core loop is fun minute to minute, which only the prototype can answer.

Reviewed from scratch on 28 October 2026, against the whole document as it now stands.

### What's strong

- **A real hook nobody owns.** Plant simulation, document verification and nuclear moral stakes, in real history. The benchmarks show adjacent games, none combining these.
- **Attention is the single skill, and it feeds the story.** Planted faults, the amended dispatch, the format change, Option C and the final target page all reward the same habit. That coherence is rare and is the design's best quality.
- **Consequences are traceable.** The debrief showing the moment you could have known turns failure into learning rather than frustration.
- **The endings land.** The last shift, the clinical printout and the blinking cursor are a memorable close. The refusal ending converging on the same ritual is elegant.
- **Realism with rules.** One lamp per binary state, operator-owned confirmation, faults only where a checklist exists: friction without unfairness.

### Mechanic by mechanic

| Mechanic | Viability | Why | Action |
|---|---|---|---|
| Procedures with confirm steps | Strong | Clear verbs, learnable, a natural home for faults | Prototype first |
| Plant model and faults | Strong, scope risk | Deep and coherent; 18 systems is a lot | Tiers already flagged; keep to 4 for prototype |
| Order verification | Good | Proven loop; assessment codes keep it tense | Define message formats and rules data early |
| Planted faults | Strong | The design's signature | Needs a content tool to author and track seeds |
| Hidden state | Needs work | One "crew trust" value, but beats assume trust per person | Model trust per crew member |
| Door and visitors | Needs a decision | Core loop still describes a constant queue; the review proposed 2–4 visits | Apply the demotion in the core loop |
| Work-order queue | Missing | Proposed as the answer to "no natural queue" but never designed | Define it, or accept procedures as the queue |
| Off-duty and Home | Weak | Thin compared with *Papers, Please*'s money loop; barely referenced since | Cut from the prototype; decide later if it earns its place |
| Launch sequence | Strong | Physical, ritualised, memorable sound | Keep each run to 60–90 seconds |
| Time | **Undefined** | See below | Must be designed before coding |

### The missing mechanic: time

The document uses three clocks without reconciling them. A shift is 24 hours of game time played in 10–15 minutes, which is roughly 100× compression. But valve travel takes "a few seconds", the socket clues arrive at 0:20 and 0:45, and launch steps take up to 10 seconds, which are real-time scales. At 100× compression, the 4-minute report delay in the socket beat would pass in under three real seconds.

**Recommendation: two speeds.** Calm periods run compressed, skipping ahead between scheduled events with the clock visibly jumping. When an event starts, or the player begins a procedure, time drops to real time until it's resolved. Every timing in the document is then read as real time during events. This is the single most important design decision still open.

### Contradictions to resolve

1. **Shift count.** Setting and the content plan say about 20 shifts; the design challenges and endings assume 12–15 plus a final chapter. Pick one and restructure the content plan.
2. **Does the missile survive Act 3?** The socket beat "always escalates", but the final chapter requires the missile to survive. Define the good outcome: the leak is contained, the tank is drained and repaired, the site goes off alert, then returns to alert for the last shift.
3. **Key turned as an ending.** It's listed as an override ending for turning a key on the Act 3 misrouted order, which would stop the game before the final chapter. Suggest it becomes a debrief record and epilogue line, not an ending.
4. **Two interfaces.** The Interface section describes the illustrated three-view desk with draggable paper; the build plan says terminal HMI first. Mark the illustrated version as a later presentation so a developer isn't confused.
5. **Scoring and Standing.** Scoring rewards pay; pay feeds the off-duty loop, which is undecided. Tie scoring to Standing and commendations until Home is settled.

### Biggest risks

- **Is it fun minute to minute?** Every beat described is a highlight. The game lives or dies on the 80% of time between them: reading traffic, running routine procedures, confirming lamps. The prototype must test a deliberately boring shift, not just the socket beat.
- **Onboarding.** A terminal HMI, F-key pages, procedures and jargon is a steep start. Act 1 must teach one page and one procedure at a time, with nothing able to fail.
- **Writing load.** Hidden values are only fair if crew behaviour reveals them. That's a lot of reactive dialogue for a solo developer.
- **Audience.** It's a niche within a niche: *Papers, Please* fans who also like simulators and can sit with heavy themes. That's fine for a solo project, but plan marketing around the premise and the ending, not breadth.

### Before writing code

1. Decide the time model (recommendation above).
2. Resolve the five contradictions.
3. Define per-person trust in the hidden-state table.
4. Write one complete prototype shift as data: events, messages, procedures, faults, and the expected player path, including a calm stretch.

Then build the terminal prototype with four systems and play that shift until it's either fun or clearly isn't.

**Cleanup, 28 October 2026.** Resolved above: the time model (two speeds, all values tunable), flexible shift count, per-person trust with constant response times, door pacing and work orders, the Home loop removed, end-of-shift scoring with three strikes, the full endings list, Act 3 survival, Key turned as a record, and the illustrated interface marked as a later presentation. Still open: whether the minute-to-minute loop is fun, which only the prototype can answer.
