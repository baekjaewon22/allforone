package kr.allforone.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AfoHealthConnectPlugin.class);
        super.onCreate(savedInstanceState);
    }
}