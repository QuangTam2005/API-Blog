$(function () {
  const $top = $('.back-top');
  $(window).on('scroll', function () { $top.toggle($(this).scrollTop() > 500); });
  $top.on('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  $('.copy-btn').on('click', function () {
    const text = $('#' + $(this).data('copy')).text();
    navigator.clipboard.writeText(text).then(() => {
      const original = $(this).text(); $(this).text('copied!');
      setTimeout(() => $(this).text(original), 1300);
    });
  });
  const scenarios = {
    enroll: { copy: 'Clicks “Enroll” on CS101', title: 'Enrollment confirmed', result: 'The API created ENR-7781 for CS101.', badge: '201 CREATED', request: '<span class="code-method">POST</span> /api/v1/enrollments\nContent-Type: application/json\n\n{\n  <span class="code-key">"studentId"</span>: <span class="code-string">"GZU-2048"</span>,\n  <span class="code-key">"courseId"</span>: <span class="code-string">"CS101"</span>\n}', response: '<span class="code-status">201 Created</span>\nContent-Type: application/json\n\n{\n  <span class="code-key">"id"</span>: <span class="code-string">"ENR-7781"</span>,\n  <span class="code-key">"status"</span>: <span class="code-string">"confirmed"</span>,\n  <span class="code-key">"course"</span>: <span class="code-string">"CS101 · Web Foundations"</span>\n}' },
    courses: { copy: 'Opens “My courses”', title: 'Courses loaded', result: 'The API returned 3 courses as a JSON list.', badge: '200 OK', request: '<span class="code-method">GET</span> /api/v1/students/GZU-2048/courses', response: '<span class="code-status">200 OK</span>\nContent-Type: application/json\n\n{\n  <span class="code-key">"count"</span>: <span class="code-string">3</span>,\n  <span class="code-key">"courses"</span>: <span class="code-string">["CS101", "MATH204", "UX200"]</span>\n}' },
    drop: { copy: 'Clicks “Drop” on MATH204', title: 'Course removed', result: 'The API deleted the enrollment safely.', badge: '204 NO CONTENT', request: '<span class="code-method">DELETE</span> /api/v1/enrollments/ENR-5520', response: '<span class="code-status">204 No Content</span>\n\nThe enrollment is gone — no response body needed.' }
  };
  let currentScenario = 'enroll';
  function setScenario(key) {
    currentScenario = key;
    const item = scenarios[key];
    $('#scenario-copy').text(item.copy);
    $('#request-code code').html(item.request);
    $('#response-code code').html(item.response);
    $('#result-title').text('Ready to ' + (key === 'enroll' ? 'enroll' : key === 'courses' ? 'load courses' : 'drop course'));
    $('#result-copy').text('Your request is waiting to be sent.');
    $('#result-badge').text('READY').css('background', 'var(--yellow)');
    $('.track-node').removeClass('active done').first().addClass('active');
    $('.track-line i').css('width', '0%');
  }
  $('.scenario-tab').on('click', function () {
    $('.scenario-tab').removeClass('active');
    $(this).addClass('active');
    setScenario($(this).data('scenario'));
  });
  $('.run-demo').on('click', function () {
    const item = scenarios[currentScenario];
    const $button = $(this).prop('disabled', true).addClass('is-running').html('Sending… <span>↗</span>');
    $('.track-node').removeClass('active done').first().addClass('done');
    $('.track-line i').css('width', '0%');
    [1, 2, 3].forEach((step) => setTimeout(() => {
      $('.track-node').eq(step).addClass('active').prevAll().addClass('done');
      $('.track-line i').css('width', `${step * 33.33}%`);
    }, step * 500));
    setTimeout(() => {
      $('#result-title').text(item.title);
      $('#result-copy').text(item.result);
      $('#result-badge').text(item.badge).css('background', 'var(--lime)');
      $button.prop('disabled', false).removeClass('is-running').html('Run again <span>▶</span>');
    }, 1750);
  });
  $('.navbar-nav .nav-link').on('click', function () {
    const nav = bootstrap.Collapse.getInstance(document.getElementById('mainNav'));
    if (nav) nav.hide();
  });
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) $(entry.target).addClass('revealed');
  }), { threshold: 0.12 });
  $('.reason-card, .flow-step, .resource-list a, .map-node').each(function () { $(this).addClass('reveal'); observer.observe(this); });
});
