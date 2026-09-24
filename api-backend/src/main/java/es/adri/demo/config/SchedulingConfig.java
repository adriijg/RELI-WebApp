package es.adri.demo.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestClient;

@Configuration
@EnableScheduling
@EnableCaching
public class SchedulingConfig {

	@Bean
	RestClient resendRestClient() {
		return RestClient.builder().baseUrl("https://api.resend.com").build();
	}
}
