import {
  unstable_ImmediatePriority as ImmediatePriority,
  unstable_IdlePriority as IdlePriority,
  unstable_LowPriority as LowPriority,
  unstable_NormalPriority as NormalPriority,
  unstable_UserBlockingPriority as UserBlockingPriority,
  unstable_getFirstCallbackNode as getFirstCallbackNode,
  unstable_scheduleCallback as scheduleCallback,
  unstable_cancelCallback as cancelCallback,
  unstable_shouldYield as shouldYield,
  CallbackNode,
} from "scheduler";

import "./index.css";

type Priority =
  | typeof IdlePriority
  | typeof ImmediatePriority
  | typeof LowPriority
  | typeof NormalPriority
  | typeof UserBlockingPriority;

interface Work {
  priority: Priority;
  count: number;
}

const root = document.getElementById("root") as Element;
const contentDom = document.getElementById("content") as Element;

const workList: Work[] = [];

let prevPriority: Priority = IdlePriority;

let curCallback: CallbackNode | null;

// 优先级列表
const priority2UseList: Priority[] = [
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
];

const priority2Name = [
  "ImmediatePriority",
  "UserBlockingPriority",
  "NormalPriority",
  "LowPriority",
];

priority2UseList.forEach((priority, index) => {
  const btn = document.createElement("button");
  btn.innerText = priority2Name[index];

  btn.onclick = () => {
    // 模拟添加任务
    workList.push({
      count: 100,
      priority,
    });

    schedule();
  };

  root.appendChild(btn);
});

function schedule() {
  // 当前是否存在正在调度的回调
  let cbNode = getFirstCallbackNode();

  // 筛选最高优先级的任务
  const curWork = workList.sort((w1, w2) => {
    return w1.priority - w2.priority;
  })[0];

  if (!curWork) {
    cbNode && cancelCallback(cbNode);
    curCallback = null;
    return;
  }

  const { priority: curPriority } = curWork;

  if (curPriority === prevPriority) {
    // 需要调度的任务跟正在调度的任务优先级一样，不需要调度
    return;
  }

  // 准备调度优先级最高的任务
  // 调度之前 若有正在调度的任务  中断它
  cbNode && cancelCallback(cbNode);

  // 调度优先级最高的任务
  curCallback = scheduleCallback(curPriority, perform.bind(null, curWork));
}

// 执行具体的工作
function perform(work: Work, didTimeout?: boolean): any {
  // 是否需要同步执行：1. 任务是同步优先级 2. 当前调度的任务过期了，需要同步执行
  const needSync = work.priority === ImmediatePriority || didTimeout;

  while ((needSync || !shouldYield()) && work.count) {
    work.count--;

    // 执行具体的工作
    inserItem(work.priority + "");
  }
  prevPriority = work.priority;

  if (!work.count) {
    // 清除任务
    const workIndex = workList.indexOf(work);
    workList.splice(workIndex, 1);
    // 重置优先级
    prevPriority = IdlePriority;
  }
  const prevCallback = curCallback;
  schedule();
  const nextCallback = curCallback;

  if (nextCallback && prevCallback === nextCallback) {
    // callback没变 表示 同一任务未完成，时间切片用完（5ms）
    return perform.bind(null, work);
  }
}

function inserItem(content: string) {
  const span = document.createElement("span");
  span.innerText = content;
  span.className = `pri-${content}`;

  // 模拟耗时操作
  let result = 0;
  let count = 10000000;
  while (count) {
    count--;
    result += count;
  }

  contentDom.appendChild(span);
}
