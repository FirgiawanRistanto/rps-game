import * as fp from 'fingerpose';
const paper = new fp.GestureDescription('paper');
for (let finger of fp.Finger.all) {
  paper.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
}
export default paper;   