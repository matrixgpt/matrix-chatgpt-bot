import  mixpanel from "mixpanel";
import { MIXPANEL_PROJECT_TOKEN } from './env.js';
export default class MonitorActivities{
  constructor(private userId: string, private uns_name: string){
   mixpanel.init(MIXPANEL_PROJECT_TOKEN).people.set(this.userId, {});
  }
  trackSendMessageEvent(message: string){
    mixpanel.track('Msg | bot trustcompanion message sent', {
      distinct_id: this.userId,
      uns_name: this.uns_name,
      raw_input: message
    });
  }
}
