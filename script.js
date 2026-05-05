const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const views = Array.from(document.querySelectorAll('.panel-view'));
const contentPanel = document.getElementById('content-panel');
const resourceGroups = document.getElementById('resource-groups');

function activatePanel(panelName) {
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
  contentPanel.focus({ preventScroll: true });
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => activatePanel(link.dataset.panel));
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

activatePanel('thesis');
