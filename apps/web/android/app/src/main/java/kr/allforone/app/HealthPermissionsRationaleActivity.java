package kr.allforone.app;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;

public class HealthPermissionsRationaleActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        TextView view = new TextView(this);
        view.setPadding(48, 48, 48, 48);
        view.setText("All For One은 걸음 수, 수면, 운동, 심박, 체중 데이터를 건강 기록 자동화를 위해 읽습니다. 데이터는 사용자가 허용한 범위에서만 동기화됩니다.");
        setContentView(view);
    }
}