// The prototype shift's timeline: 0800Z 17 SEP 80 to 0800Z 18 SEP 80.
// A composite of Act 1-3 beats: routine traffic and checks, a work order with a
// restoration fault, a lying detector, a power transfer, then the socket.
import type { Game } from '../sim/game';
import { MESSAGES } from './messages';
import { tAt } from '../sim/time';

export function installScript(g: Game) {
  for (const m of MESSAGES) if (m.at) g.at(tAt(m.at), () => g.deliver(m.id));

  g.at(tAt('0801'), () => g.say('LCC', "WHITLOCK: Morning. Coffee's fresh. Mercer says S1 fuel's creeping again, and L7-A was acting up overnight."));
  g.at(tAt('0802'), () => g.say('LCC', 'ORTIZ: Point tests are on the board, sir. WO 7-100.'));

  g.at(tAt('1000'), () => g.teamArrive('T113'));

  // A vapour detector that lies. Its partner reads normal; only a cross-check tells you.
  g.at(tAt('1500'), () => { g.sensors['VD L7-A'].drifting = true; g.sensors['VD L7-A'].driftVal = g.ind.VD['VD L7-A']; });

  // Commercial power fails. The diesel picks up the bus; every fan drops out and stays out.
  g.at(tAt('1720'), () => {
    g.power.commercial = false;
    g.in(25, () => g.say('LCC', "WHITLOCK: We're on the diesel. Fans are all down, Commander."));
  });
  g.at(tAt('1803'), () => { g.power.commercial = true; });

  g.at(tAt('2215'), () => g.say('LCC', "PRUITT: Quiet night. ...Anybody else hear that pump cycling? No? Okay."));
  g.at(tAt('0010'), () => g.say('LCC', 'WHITLOCK: Halfway. Want me to take the console for an hour?'));

  g.at(tAt('0200'), () => g.teamArrive('T121'));
}
