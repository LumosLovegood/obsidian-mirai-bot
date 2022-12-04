import { review } from 'src/services/timerService';
import type MiraiBot from '../main';
import { wodService } from '../services/subscriptionService';

export class TimerController {
	constructor(private readonly plugin: MiraiBot) {
		this.init();
	}

	init() {
		this.addTimer('08:00', async () => await review());
		this.addTimer('12:00', async (plugin) => await wodService(plugin));
	}

	addTimer(time: string, callout: (plugin: MiraiBot) => any) {
		const interval = (window.moment(time, 'HH:mm') as unknown as number) - (window.moment() as unknown as number);
		return this.plugin.registerInterval(
			window.setTimeout(() => callout(this.plugin), interval >= 0 ? interval : interval + 1000 * 3600 * 24),
		);
	}
}
