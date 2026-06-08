const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const views = Array.from(document.querySelectorAll('.panel-view'));
const contentPanel = document.getElementById('content-panel');
const siteFrame = document.querySelector('.site-frame');
const resourceGroups = document.getElementById('resource-groups');
const mobilePanelQuery = window.matchMedia('(max-width: 900px)');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function activatePanel(panelName, options = {}) {
  navLinks.forEach((link) => {
    const isActive = link.dataset.panel === panelName;
    link.classList.toggle('is-active', isActive);
    link.setAttribute('aria-pressed', String(isActive));
  });

  views.forEach((view) => {
    const shouldShow = view.id === `panel-${panelName}`;
    view.hidden = !shouldShow;
    view.classList.toggle('is-visible', shouldShow);
  });

  contentPanel.dataset.activePanel = panelName;
  siteFrame.dataset.activePanel = panelName;

  if (panelName === 'presentation') {
    schedulePresentationSleepCue();
  } else {
    pausePresentationVideo();
    resetPresentationSleepCue();
  }

  contentPanel.focus({ preventScroll: true });

  if (options.scrollToPanel && mobilePanelQuery.matches) {
    requestAnimationFrame(() => {
      contentPanel.scrollIntoView({
        block: 'start',
        behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
      });
    });
  }
}

navLinks.forEach((link) => {
  link.setAttribute('aria-controls', `panel-${link.dataset.panel}`);
  link.addEventListener('click', () => activatePanel(link.dataset.panel, { scrollToPanel: true }));
});

const slotMap = {
  'thesis-link': window.SITE_CONFIG?.thesisLink,
  'repo-link': window.SITE_CONFIG?.repoLink,
};

Object.entries(slotMap).forEach(([slot, href]) => {
  document.querySelectorAll(`[data-slot="${slot}"]`).forEach((node) => {
    const hasUsableHref = Boolean(href && href !== '#');

    if (!hasUsableHref) {
      node.removeAttribute('href');
      node.classList.add('is-disabled');
      node.setAttribute('aria-disabled', 'true');
      return;
    }

    node.setAttribute('href', href);
    node.classList.remove('is-disabled');
    node.removeAttribute('aria-disabled');

    if (/^https?:/i.test(href)) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noreferrer');
    }
  });
});


const presentationVideo = document.querySelector('[data-presentation-video]');
const presentationToggle = document.querySelector('[data-video-toggle]');
const presentationProgress = document.querySelector('[data-video-progress]');
const presentationReplay = document.querySelector('[data-video-replay]');
const presentationSleep = document.querySelector('[data-presentation-sleep]');
let presentationSleepTimer = null;
let presentationSleepCueTimer = null;
let presentationEyeTimers = [];

function formatElapsedTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0 minutes 0 seconds elapsed';
  }

  const roundedSeconds = Math.floor(totalSeconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;
  const minuteLabel = minutes === 1 ? 'minute' : 'minutes';
  const secondLabel = seconds === 1 ? 'second' : 'seconds';

  return `${minutes} ${minuteLabel} ${seconds} ${secondLabel} elapsed`;
}

function updatePresentationProgress() {
  if (!presentationVideo || !presentationProgress) {
    return;
  }

  const duration = presentationVideo.duration;
  const currentTime = presentationVideo.currentTime;
  const hasDuration = Number.isFinite(duration) && duration > 0;
  const progress = hasDuration ? Math.min(currentTime / duration, 1) : 0;
  const progressValue = Math.round(progress * Number(presentationProgress.max));

  presentationProgress.value = String(progressValue);
  presentationProgress.style.setProperty('--progress', `${progress * 100}%`);
  presentationProgress.setAttribute('aria-valuenow', String(progressValue));
  presentationProgress.setAttribute('aria-valuetext', formatElapsedTime(currentTime));
}

function updatePresentationToggle() {
  if (!presentationVideo || !presentationToggle) {
    return;
  }

  const isPlaying = !presentationVideo.paused && !presentationVideo.ended;
  const isEnded = presentationVideo.ended;
  const label = isEnded
    ? 'Replay presentation video'
    : isPlaying
      ? 'Pause presentation video'
      : 'Play presentation video';

  presentationToggle.textContent = isEnded ? 'Replay' : isPlaying ? 'Pause' : 'Play';
  presentationToggle.setAttribute('aria-label', label);
  presentationVideo.setAttribute('aria-label', label);
}

function setPresentationEnded(isEnded) {
  if (siteFrame) {
    siteFrame.dataset.presentationEnded = String(isEnded);
  }

  if (presentationReplay) {
    presentationReplay.hidden = !isEnded;
  }
}

function pausePresentationVideo() {
  if (presentationVideo && !presentationVideo.paused) {
    presentationVideo.pause();
  }
}

function clearPresentationEyeTimers() {
  presentationEyeTimers.forEach((timerId) => {
    window.clearTimeout(timerId);
  });
  presentationEyeTimers = [];
}

function setPresentationEyeState(state) {
  if (siteFrame) {
    siteFrame.dataset.presentationEye = state;
  }
}

function queuePresentationBlink(delay) {
  const blinkTimer = window.setTimeout(() => {
    if (siteFrame?.dataset.activePanel !== 'presentation') {
      return;
    }

    const currentEyeState = siteFrame?.dataset.presentationEye;

    if (currentEyeState === 'drooping' || currentEyeState === 'sleeping') {
      return;
    }

    setPresentationEyeState('blink');

    const reopenTimer = window.setTimeout(() => {
      if (siteFrame?.dataset.activePanel !== 'presentation') {
        return;
      }

      if (siteFrame?.dataset.presentationEye === 'blink') {
        setPresentationEyeState('awake');
      }
    }, 130);

    presentationEyeTimers.push(reopenTimer);
  }, delay);

  presentationEyeTimers.push(blinkTimer);
}

function resetPresentationSleepCue() {
  if (presentationSleepTimer) {
    window.clearTimeout(presentationSleepTimer);
    presentationSleepTimer = null;
  }

  if (presentationSleepCueTimer) {
    window.clearTimeout(presentationSleepCueTimer);
    presentationSleepCueTimer = null;
  }

  clearPresentationEyeTimers();

  if (siteFrame) {
    siteFrame.dataset.presentationSleep = 'false';
    siteFrame.dataset.presentationEye = 'awake';
  }

  if (presentationSleep) {
    presentationSleep.hidden = true;
  }
}

function schedulePresentationSleepCue() {
  resetPresentationSleepCue();

  if (!presentationSleep || !siteFrame) {
    return;
  }

  presentationSleep.hidden = false;
  setPresentationEyeState('awake');

  queuePresentationBlink(6000);
  queuePresentationBlink(10000);
  queuePresentationBlink(11000);
  queuePresentationBlink(14500);

  const droopingTimer = window.setTimeout(() => {
    if (siteFrame.dataset.activePanel !== 'presentation') {
      return;
    }

    setPresentationEyeState('drooping');
  }, 17000);

  presentationEyeTimers.push(droopingTimer);

  presentationSleepTimer = window.setTimeout(() => {
    if (siteFrame.dataset.activePanel !== 'presentation') {
      return;
    }

    setPresentationEyeState('sleeping');
    presentationSleepTimer = null;
  }, 18700);

  presentationSleepCueTimer = window.setTimeout(() => {
    if (siteFrame.dataset.activePanel !== 'presentation') {
      return;
    }

    siteFrame.dataset.presentationSleep = 'true';
    presentationSleepCueTimer = null;
  }, 20000);
}

function replayPresentationVideo() {
  if (!presentationVideo) {
    return;
  }

  setPresentationEnded(false);
  presentationVideo.currentTime = 0;
  updatePresentationProgress();

  presentationVideo.play().catch(() => {
    updatePresentationToggle();
  });
}

function togglePresentationPlayback() {
  if (!presentationVideo) {
    return;
  }

  if (presentationVideo.ended) {
    replayPresentationVideo();
    return;
  }

  if (presentationVideo.paused) {
    setPresentationEnded(false);
    presentationVideo.play().catch(() => {
      updatePresentationToggle();
    });
    return;
  }

  presentationVideo.pause();
}

if (presentationVideo && presentationToggle && presentationProgress) {
  presentationToggle.addEventListener('click', togglePresentationPlayback);
  presentationVideo.addEventListener('click', togglePresentationPlayback);

  if (presentationReplay) {
    presentationReplay.addEventListener('click', replayPresentationVideo);
  }

  presentationVideo.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      togglePresentationPlayback();
    }
  });

  presentationVideo.addEventListener('play', () => {
    setPresentationEnded(false);
    updatePresentationToggle();
  });
  presentationVideo.addEventListener('pause', updatePresentationToggle);
  presentationVideo.addEventListener('ended', () => {
    setPresentationEnded(true);
    updatePresentationToggle();
    updatePresentationProgress();
  });
  presentationVideo.addEventListener('loadedmetadata', () => {
    setPresentationEnded(false);
    updatePresentationProgress();
  });
  presentationVideo.addEventListener('timeupdate', updatePresentationProgress);

  presentationProgress.addEventListener('input', () => {
    const duration = presentationVideo.duration;

    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    const nextProgress = Number(presentationProgress.value) / Number(presentationProgress.max);
    presentationVideo.currentTime = Math.min(Math.max(nextProgress, 0), 1) * duration;
    setPresentationEnded(false);
    updatePresentationProgress();
    updatePresentationToggle();
  });

  setPresentationEnded(false);
  updatePresentationToggle();
  updatePresentationProgress();
}

const resources = [
  {
    title: 'Books & Reports',
    items: [
      {
        author: 'Martin Kleppmann',
        title: 'Designing Data-Intensive Applications',
        url: 'https://dataintensive.net/'
      },
      {
        author: 'Martin Kleppmann',
        title: 'Making Sense of Stream Processing',
        url: 'https://martin.kleppmann.com/papers/stream-processing.pdf'
      },
      {
        author: 'Gregor Hohpe & Bobby Woolf',
        title: 'Enterprise Integration Patterns',
        url: 'https://www.enterpriseintegrationpatterns.com/books1.html'
      },
      {
        author: 'Ben Stopford',
        title: 'Designing Event-Driven Systems',
        url: 'https://www.confluent.io/designing-event-driven-systems/'
      },
      {
        author: 'Adam Bellemare',
        title: 'Building Event-Driven Microservices',
        url: 'https://www.oreilly.com/library/view/building-event-driven-microservices/9781492057888/'
      }
    ]
  },
  {
    title: 'Essays',
    items: [
      {
        author: 'Martin Fowler',
        title: 'What do you mean by “Event-Driven”?',
        url: 'https://martinfowler.com/articles/201701-event-driven.html'
      },
      {
        author: 'Martin Fowler',
        title: 'Event Sourcing',
        url: 'https://martinfowler.com/eaaDev/EventSourcing.html'
      },
      {
        author: 'Martin Fowler',
        title: 'Focusing on Events',
        url: 'https://martinfowler.com/eaaDev/EventNarrative.html'
      },
      {
        author: 'Martin Kleppmann',
        title: 'Stream Processing, Event Sourcing, Reactive, CEP…',
        url: 'https://martin.kleppmann.com/2015/01/29/stream-processing-event-sourcing-reactive-cep.html'
      }
    ]
  },
  {
    title: 'Patterns & Reliability',
    items: [
      {
        author: 'Gregor Hohpe & Bobby Woolf',
        title: 'Idempotent Receiver',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/IdempotentReceiver.html'
      },
      {
        author: 'Gregor Hohpe & Bobby Woolf',
        title: 'Durable Subscriber',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/DurableSubscription.html'
      },
      {
        author: 'Gregor Hohpe',
        title: 'Starbucks Does Not Use Two-Phase Commit',
        url: 'https://www.enterpriseintegrationpatterns.com/ramblings/18_starbucks.html'
      }
    ]
  },
  {
    title: 'Talks & Videos',
    items: [
      {
        author: 'Martin Fowler',
        title: 'The Many Meanings of Event-Driven Architecture',
        url: 'https://www.youtube.com/watch?v=STKCRSUsyP0'
      },
      {
        author: 'Martin Kleppmann',
        title: 'Event Sourcing and Stream Processing at Scale',
        url: 'https://martin.kleppmann.com/2016/01/29/event-sourcing-stream-processing-at-ddd-europe.html'
      },
      {
        author: 'Chris Richardson',
        title: 'Not Just Events: Developing Asynchronous Microservices',
        url: 'https://www.youtube.com/watch?v=WwrCGP96-P8'
      },
      {
        author: 'Salvatore Sanfilippo',
        title: 'The Design Of Redis Streams',
        url: 'https://www.youtube.com/watch?v=Ty1rQuRJijk'
      },
    ]
  }
];

resourceGroups.innerHTML = resources
  .map(
    (group) => `
      <section class="resource-group">
        <h3>${group.title}</h3>
        <ul>
          ${group.items
            .map(
              (item) => `
                <li>
                  <a href="${item.url}" target="_blank" rel="noreferrer">
                    <span class="resource-author">${item.author}</span>
                    <span class="resource-separator">—</span>
                    <em>${item.title}</em>
                  </a>
                </li>`
            )
            .join('')}
        </ul>
      </section>
    `
  )
  .join('');

activatePanel('thesis', { scrollToPanel: false });
