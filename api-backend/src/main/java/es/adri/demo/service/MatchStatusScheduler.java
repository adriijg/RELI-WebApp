package es.adri.demo.service;

import es.adri.demo.repository.MatchRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MatchStatusScheduler {

    private static final Duration MATCH_DURATION = Duration.ofMinutes(150);

    private final MatchRepository matchRepository;

    public MatchStatusScheduler(MatchRepository matchRepository) {
        this.matchRepository = matchRepository;
    }

    @Scheduled(fixedRate = 30_000, initialDelay = 0)
    @Transactional
    public void updateMatchStatuses() {
        LocalDateTime now = LocalDateTime.now();
        matchRepository.startDueMatches(now);
        matchRepository.finishExpiredMatches(now.minus(MATCH_DURATION));
    }
}
